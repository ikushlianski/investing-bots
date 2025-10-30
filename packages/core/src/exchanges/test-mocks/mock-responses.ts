import type { OrderResponse, GetBalanceResponse } from '../types'

export const mockOrderResponse: OrderResponse = {
  orderId: '12345',
  clientOrderId: 'test-order-1',
  symbol: 'BTCUSDT',
  side: 'buy',
  type: 'limit',
  status: 'new',
  quantity: '0.001',
  executedQuantity: '0',
  price: '50000',
  createdAt: Date.now(),
}

export const mockBalanceResponse: GetBalanceResponse = {
  balances: [
    {
      asset: 'USDT',
      free: '1000',
      locked: '0',
      total: '1000',
    },
    {
      asset: 'BTC',
      free: '0.1',
      locked: '0',
      total: '0.1',
    },
  ],
  timestamp: Date.now(),
}
