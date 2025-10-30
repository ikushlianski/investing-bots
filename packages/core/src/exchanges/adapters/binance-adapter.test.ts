import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BinanceAdapter } from './binance-adapter'
import { mockBinanceCredentials } from '../test-mocks/mock-credentials'
import type { PlaceOrderRequest } from '../types'

describe('binance-adapter', () => {
  let adapter: BinanceAdapter

  beforeEach(() => {
    adapter = new BinanceAdapter(mockBinanceCredentials)
    global.fetch = vi.fn()
  })

  describe('constructor', () => {
    it('should initialize with testnet URL for testnet environment', () => {
      const testnetAdapter = new BinanceAdapter({
        ...mockBinanceCredentials,
        environment: 'testnet',
      })

      expect(testnetAdapter.getName()).toBe('binance')
    })

    it('should initialize with production URL for production environment', () => {
      const prodAdapter = new BinanceAdapter({
        ...mockBinanceCredentials,
        environment: 'production',
      })

      expect(prodAdapter.getName()).toBe('binance')
    })
  })

  describe('getName', () => {
    it('should return binance as exchange name', () => {
      expect(adapter.getName()).toBe('binance')
    })
  })

  describe('placeOrder', () => {
    it('should validate order request structure', () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orderId: 12345,
          symbol: 'BTCUSDT',
          status: 'NEW',
          clientOrderId: 'test-1',
          side: 'BUY',
          type: 'LIMIT',
          origQty: '0.001',
          executedQty: '0',
          price: '50000',
          transactTime: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const request: PlaceOrderRequest = {
        symbol: 'BTCUSDT',
        side: 'buy',
        type: 'limit',
        quantity: '0.001',
        price: '50000',
        timeInForce: 'GTC',
      }

      return adapter.placeOrder(request).then((response) => {
        expect(response.symbol).toBe('BTCUSDT')
        expect(response.side).toBe('buy')
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('should include API key in headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orderId: 12345,
          symbol: 'BTCUSDT',
          status: 'NEW',
          clientOrderId: 'test-1',
          side: 'BUY',
          type: 'LIMIT',
          origQty: '0.001',
          executedQty: '0',
          price: '50000',
          transactTime: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const request: PlaceOrderRequest = {
        symbol: 'BTCUSDT',
        side: 'buy',
        type: 'market',
        quantity: '0.001',
      }

      await adapter.placeOrder(request)

      const fetchCall = mockFetch.mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers['X-MBX-APIKEY']).toBe(mockBinanceCredentials.apiKey)
    })
  })

  describe('getBalance', () => {
    it('should return formatted balance response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balances: [
            { asset: 'USDT', free: '1000', locked: '0' },
            { asset: 'BTC', free: '0.1', locked: '0' },
          ],
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.getBalance()

      expect(response.balances).toHaveLength(2)
      expect(response.balances[0].asset).toBe('USDT')
      expect(response.balances[0].total).toBe('1000')
      expect(response.timestamp).toBeDefined()
    })

    it('should filter by asset when provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          balances: [
            { asset: 'USDT', free: '1000', locked: '0' },
            { asset: 'BTC', free: '0.1', locked: '0' },
          ],
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.getBalance('USDT')

      expect(response.balances).toHaveLength(1)
      expect(response.balances[0].asset).toBe('USDT')
    })
  })

  describe('cancelOrder', () => {
    it('should send cancel request with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orderId: 12345,
          symbol: 'BTCUSDT',
          status: 'CANCELED',
          clientOrderId: 'test-1',
          side: 'BUY',
          type: 'LIMIT',
          origQty: '0.001',
          executedQty: '0',
          transactTime: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.cancelOrder('12345', 'BTCUSDT')

      expect(response.orderId).toBe('12345')
      expect(response.status).toBe('cancelled')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('orderId=12345'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  describe('getOrder', () => {
    it('should retrieve order details', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orderId: 12345,
          symbol: 'BTCUSDT',
          status: 'FILLED',
          clientOrderId: 'test-1',
          side: 'BUY',
          type: 'LIMIT',
          origQty: '0.001',
          executedQty: '0.001',
          avgPrice: '50000',
          transactTime: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.getOrder('12345', 'BTCUSDT')

      expect(response.orderId).toBe('12345')
      expect(response.status).toBe('filled')
      expect(response.executedQuantity).toBe('0.001')
    })
  })
})
