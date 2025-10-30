import type {
  ExchangeCredentials,
  GetBalanceResponse,
  OrderResponse,
  PlaceOrderRequest,
} from '../types'

export interface ExchangeAdapter {
  getName(): string

  placeOrder(request: PlaceOrderRequest): Promise<OrderResponse>

  getBalance(asset?: string): Promise<GetBalanceResponse>

  cancelOrder(orderId: string, symbol: string): Promise<OrderResponse>

  getOrder(orderId: string, symbol: string): Promise<OrderResponse>
}

export interface ExchangeAdapterConstructor {
  new (credentials: ExchangeCredentials): ExchangeAdapter
}
