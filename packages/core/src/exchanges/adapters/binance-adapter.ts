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
import { createHmacSha256Signature, createQueryString } from '@investing-tool/utils'

interface BinanceOrderResponse {
  orderId: number
  symbol: string
  status: string
  clientOrderId: string
  side: string
  type: string
  origQty: string
  executedQty: string
  price?: string
  avgPrice?: string
  transactTime: number
  updateTime?: number
}

interface BinanceBalanceResponse {
  balances: Array<{
    asset: string
    free: string
    locked: string
  }>
}

export class BinanceAdapter implements ExchangeAdapter {
  private readonly baseUrl: string
  private readonly credentials: ExchangeCredentials
  private readonly timeout = 10000

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials
    this.baseUrl =
      credentials.environment === 'testnet'
        ? 'https://testnet.binance.vision'
        : 'https://api.binance.com'
  }

  getName(): string {
    return 'binance'
  }

  async placeOrder(request: PlaceOrderRequest): Promise<OrderResponse> {
    const timestamp = Date.now()
    const params: Record<string, string | number> = {
      symbol: request.symbol.toUpperCase(),
      side: request.side.toUpperCase(),
      type: this.mapOrderType(request.type),
      quantity: request.quantity,
      timestamp,
    }

    if (request.price) {
      params.price = request.price
    }

    if (request.stopPrice) {
      params.stopPrice = request.stopPrice
    }

    if (request.timeInForce) {
      params.timeInForce = request.timeInForce
    } else if (request.type === 'limit') {
      params.timeInForce = 'GTC'
    }

    if (request.clientOrderId) {
      params.newClientOrderId = request.clientOrderId
    }

    const queryString = createQueryString(params)
    const signature = await createHmacSha256Signature(
      this.credentials.apiSecret,
      queryString,
    )

    const signedQueryString = `${queryString}&signature=${signature}`

    const response = await this.makeRequest<BinanceOrderResponse>(
      'POST',
      '/api/v3/order',
      signedQueryString,
    )

    return this.mapOrderResponse(response)
  }

  async getBalance(asset?: string): Promise<GetBalanceResponse> {
    const timestamp = Date.now()
    const queryString = createQueryString({ timestamp })
    const signature = await createHmacSha256Signature(
      this.credentials.apiSecret,
      queryString,
    )

    const signedQueryString = `${queryString}&signature=${signature}`

    const response = await this.makeRequest<BinanceBalanceResponse>(
      'GET',
      '/api/v3/account',
      signedQueryString,
    )

    const balances = response.balances
      .filter((b) => !asset || b.asset === asset.toUpperCase())
      .map((b) => ({
        asset: b.asset,
        free: b.free,
        locked: b.locked,
        total: (parseFloat(b.free) + parseFloat(b.locked)).toString(),
      }))

    return {
      balances,
      timestamp,
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<OrderResponse> {
    const timestamp = Date.now()
    const params = {
      symbol: symbol.toUpperCase(),
      orderId,
      timestamp,
    }

    const queryString = createQueryString(params)
    const signature = await createHmacSha256Signature(
      this.credentials.apiSecret,
      queryString,
    )

    const signedQueryString = `${queryString}&signature=${signature}`

    const response = await this.makeRequest<BinanceOrderResponse>(
      'DELETE',
      '/api/v3/order',
      signedQueryString,
    )

    return this.mapOrderResponse(response)
  }

  async getOrder(orderId: string, symbol: string): Promise<OrderResponse> {
    const timestamp = Date.now()
    const params = {
      symbol: symbol.toUpperCase(),
      orderId,
      timestamp,
    }

    const queryString = createQueryString(params)
    const signature = await createHmacSha256Signature(
      this.credentials.apiSecret,
      queryString,
    )

    const signedQueryString = `${queryString}&signature=${signature}`

    const response = await this.makeRequest<BinanceOrderResponse>(
      'GET',
      '/api/v3/order',
      signedQueryString,
    )

    return this.mapOrderResponse(response)
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    queryString?: string,
  ): Promise<T> {
    const url = queryString
      ? `${this.baseUrl}${endpoint}?${queryString}`
      : `${this.baseUrl}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-MBX-APIKEY': this.credentials.apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        await this.handleErrorResponse(response)
      }

      return (await response.json()) as T
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

  private async handleErrorResponse(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage =
      (errorData as { msg?: string }).msg || 'Unknown error'

    if (response.status === 401 || response.status === 403) {
      throw new ExchangeAuthenticationError(this.getName(), errorData)
    }

    if (response.status === 429) {
      throw new ExchangeRateLimitError(this.getName(), errorData)
    }

    if (response.status === 400) {
      const code = (errorData as { code?: number }).code

      if (code === -2010) {
        throw new ExchangeInsufficientBalanceError(this.getName(), errorData)
      }

      if (code === -2011) {
        throw new ExchangeOrderNotFoundError(
          this.getName(),
          'unknown',
          errorData,
        )
      }

      throw new ExchangeInvalidOrderError(
        this.getName(),
        errorMessage,
        errorData,
      )
    }

    throw new ExchangeNetworkError(this.getName(), errorData)
  }

  private mapOrderType(type: string): string {
    const typeMap: Record<string, string> = {
      market: 'MARKET',
      limit: 'LIMIT',
      stop_loss: 'STOP_LOSS',
      take_profit: 'TAKE_PROFIT',
      stop_loss_limit: 'STOP_LOSS_LIMIT',
      take_profit_limit: 'TAKE_PROFIT_LIMIT',
    }

    return typeMap[type] || type.toUpperCase()
  }

  private mapOrderStatus(status: string): OrderResponse['status'] {
    const statusMap: Record<string, OrderResponse['status']> = {
      NEW: 'new',
      PARTIALLY_FILLED: 'partially_filled',
      FILLED: 'filled',
      CANCELED: 'cancelled',
      PENDING_CANCEL: 'pending',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
    }

    return statusMap[status] || 'new'
  }

  private mapOrderResponse(response: BinanceOrderResponse): OrderResponse {
    return {
      orderId: response.orderId.toString(),
      clientOrderId: response.clientOrderId,
      symbol: response.symbol,
      side: response.side.toLowerCase() as 'buy' | 'sell',
      type: response.type.toLowerCase().replace(/_/g, '_') as OrderResponse['type'],
      status: this.mapOrderStatus(response.status),
      quantity: response.origQty,
      executedQuantity: response.executedQty,
      price: response.price,
      averagePrice: response.avgPrice,
      createdAt: response.transactTime,
      updatedAt: response.updateTime,
    }
  }
}
