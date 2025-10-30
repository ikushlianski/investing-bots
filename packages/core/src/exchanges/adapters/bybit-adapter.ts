import type { ExchangeAdapter } from './exchange-adapter'
import type {
  ExchangeCredentials,
  GetBalanceResponse,
  OrderResponse,
  PlaceOrderRequest,
} from '../types'
import {
  ExchangeAuthenticationError,
  ExchangeInsufficientBalanceError,
  ExchangeInvalidOrderError,
  ExchangeNetworkError,
  ExchangeOrderNotFoundError,
  ExchangeRateLimitError,
  ExchangeTimeoutError,
} from '../errors'
import { createHmacSha256Signature } from '@investing-tool/utils'

interface BybitOrderResult {
  orderId: string
  orderLinkId?: string
  symbol: string
  side: string
  orderType: string
  orderStatus: string
  qty: string
  cumExecQty: string
  price?: string
  avgPrice?: string
  createdTime: string
  updatedTime?: string
}

interface BybitOrderResponse {
  retCode: number
  retMsg: string
  result?: BybitOrderResult
  time: number
}

interface BybitBalanceItem {
  coin: string
  walletBalance: string
  availableBalance: string
  locked?: string
}

interface BybitBalanceResponse {
  retCode: number
  retMsg: string
  result?: {
    list: Array<{
      coin: Array<BybitBalanceItem>
    }>
  }
  time: number
}

export class BybitAdapter implements ExchangeAdapter {
  private readonly baseUrl: string
  private readonly credentials: ExchangeCredentials
  private readonly timeout = 10000
  private readonly recvWindow = 5000

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials
    this.baseUrl =
      credentials.environment === 'testnet'
        ? 'https://api-testnet.bybit.com'
        : 'https://api.bybit.com'
  }

  getName(): string {
    return 'bybit'
  }

  async placeOrder(request: PlaceOrderRequest): Promise<OrderResponse> {
    const timestamp = Date.now()

    const params = {
      category: 'spot',
      symbol: request.symbol.toUpperCase(),
      side: this.mapOrderSide(request.side),
      orderType: this.mapOrderType(request.type),
      qty: request.quantity,
      ...(request.price && { price: request.price }),
      ...(request.stopPrice && { triggerPrice: request.stopPrice }),
      ...(request.timeInForce && { timeInForce: request.timeInForce }),
      ...(request.clientOrderId && { orderLinkId: request.clientOrderId }),
    }

    const response = await this.makeRequest<BybitOrderResponse>(
      'POST',
      '/v5/order/create',
      params,
      timestamp,
    )

    if (!response.result) {
      throw new ExchangeInvalidOrderError(
        this.getName(),
        response.retMsg,
        response,
      )
    }

    return this.mapOrderResponse(response.result)
  }

  async getBalance(asset?: string): Promise<GetBalanceResponse> {
    const timestamp = Date.now()

    const params = {
      accountType: 'SPOT',
      ...(asset && { coin: asset.toUpperCase() }),
    }

    const response = await this.makeRequest<BybitBalanceResponse>(
      'GET',
      '/v5/account/wallet-balance',
      params,
      timestamp,
    )

    if (!response.result?.list?.[0]?.coin) {
      return {
        balances: [],
        timestamp,
      }
    }

    const balances = response.result.list[0].coin.map((b) => {
      const free = parseFloat(b.availableBalance)
      const locked = parseFloat(b.locked || '0')
      const total = free + locked

      return {
        asset: b.coin,
        free: b.availableBalance,
        locked: b.locked || '0',
        total: total.toString(),
      }
    })

    return {
      balances,
      timestamp,
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<OrderResponse> {
    const timestamp = Date.now()

    const params = {
      category: 'spot',
      symbol: symbol.toUpperCase(),
      orderId,
    }

    const response = await this.makeRequest<BybitOrderResponse>(
      'POST',
      '/v5/order/cancel',
      params,
      timestamp,
    )

    if (!response.result) {
      throw new ExchangeOrderNotFoundError(this.getName(), orderId, response)
    }

    return this.mapOrderResponse(response.result)
  }

  async getOrder(orderId: string, symbol: string): Promise<OrderResponse> {
    const timestamp = Date.now()

    const params = {
      category: 'spot',
      symbol: symbol.toUpperCase(),
      orderId,
    }

    const response = await this.makeRequest<BybitOrderResponse>(
      'GET',
      '/v5/order/realtime',
      params,
      timestamp,
    )

    if (!response.result) {
      throw new ExchangeOrderNotFoundError(this.getName(), orderId, response)
    }

    return this.mapOrderResponse(response.result)
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    params: Record<string, string | number>,
    timestamp: number,
  ): Promise<T> {
    const queryString = JSON.stringify(params)
    const signaturePayload = `${timestamp}${this.credentials.apiKey}${this.recvWindow}${queryString}`

    const signature = await createHmacSha256Signature(
      this.credentials.apiSecret,
      signaturePayload,
    )

    const url = `${this.baseUrl}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-BAPI-API-KEY': this.credentials.apiKey,
          'X-BAPI-SIGN': signature,
          'X-BAPI-TIMESTAMP': timestamp.toString(),
          'X-BAPI-RECV-WINDOW': this.recvWindow.toString(),
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' ? queryString : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = (await response.json()) as T

      if (!response.ok) {
        this.handleErrorResponse(response, data)
      }

      this.checkBybitResponse(data)

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExchangeTimeoutError(this.getName(), error)
      }

      if (
        error instanceof ExchangeAuthenticationError ||
        error instanceof ExchangeInsufficientBalanceError ||
        error instanceof ExchangeInvalidOrderError ||
        error instanceof ExchangeOrderNotFoundError ||
        error instanceof ExchangeRateLimitError
      ) {
        throw error
      }

      throw new ExchangeNetworkError(this.getName(), error)
    }
  }

  private checkBybitResponse<T>(data: T): void {
    const response = data as { retCode: number; retMsg: string }

    if (response.retCode !== 0) {
      if (response.retCode === 10001) {
        throw new ExchangeAuthenticationError(this.getName(), data)
      }

      if (response.retCode === 10006) {
        throw new ExchangeRateLimitError(this.getName(), data)
      }

      if (response.retCode === 170131) {
        throw new ExchangeInsufficientBalanceError(this.getName(), data)
      }

      if (response.retCode === 110001) {
        throw new ExchangeOrderNotFoundError(this.getName(), 'unknown', data)
      }

      throw new ExchangeInvalidOrderError(
        this.getName(),
        response.retMsg,
        data,
      )
    }
  }

  private handleErrorResponse(response: Response, data: unknown): void {
    if (response.status === 401 || response.status === 403) {
      throw new ExchangeAuthenticationError(this.getName(), data)
    }

    if (response.status === 429) {
      throw new ExchangeRateLimitError(this.getName(), data)
    }

    throw new ExchangeNetworkError(this.getName(), data)
  }

  private mapOrderSide(side: string): string {
    return side.charAt(0).toUpperCase() + side.slice(1)
  }

  private mapOrderType(type: string): string {
    const typeMap: Record<string, string> = {
      market: 'Market',
      limit: 'Limit',
    }

    return typeMap[type] || 'Limit'
  }

  private mapOrderStatus(status: string): OrderResponse['status'] {
    const statusMap: Record<string, OrderResponse['status']> = {
      New: 'new',
      Created: 'new',
      PartiallyFilled: 'partially_filled',
      Filled: 'filled',
      Cancelled: 'cancelled',
      Rejected: 'rejected',
      Expired: 'expired',
      PendingCancel: 'pending',
    }

    return statusMap[status] || 'new'
  }

  private mapOrderResponse(result: BybitOrderResult): OrderResponse {
    return {
      orderId: result.orderId,
      clientOrderId: result.orderLinkId,
      symbol: result.symbol,
      side: result.side.toLowerCase() as 'buy' | 'sell',
      type: result.orderType.toLowerCase() as OrderResponse['type'],
      status: this.mapOrderStatus(result.orderStatus),
      quantity: result.qty,
      executedQuantity: result.cumExecQty,
      price: result.price,
      averagePrice: result.avgPrice,
      createdAt: parseInt(result.createdTime),
      updatedAt: result.updatedTime ? parseInt(result.updatedTime) : undefined,
    }
  }
}
