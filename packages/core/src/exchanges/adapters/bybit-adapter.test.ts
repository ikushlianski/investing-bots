import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BybitAdapter } from './bybit-adapter'
import { mockBybitCredentials } from '../test-mocks/mock-credentials'
import type { PlaceOrderRequest } from '../types'

describe('bybit-adapter', () => {
  let adapter: BybitAdapter

  beforeEach(() => {
    adapter = new BybitAdapter(mockBybitCredentials)
    global.fetch = vi.fn()
  })

  describe('constructor', () => {
    it('should initialize with testnet URL for testnet environment', () => {
      const testnetAdapter = new BybitAdapter({
        ...mockBybitCredentials,
        environment: 'testnet',
      })

      expect(testnetAdapter.getName()).toBe('bybit')
    })

    it('should initialize with production URL for production environment', () => {
      const prodAdapter = new BybitAdapter({
        ...mockBybitCredentials,
        environment: 'production',
      })

      expect(prodAdapter.getName()).toBe('bybit')
    })
  })

  describe('getName', () => {
    it('should return bybit as exchange name', () => {
      expect(adapter.getName()).toBe('bybit')
    })
  })

  describe('placeOrder', () => {
    it('should validate order request structure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 0,
          retMsg: 'OK',
          result: {
            orderId: '12345',
            symbol: 'BTCUSDT',
            side: 'Buy',
            orderType: 'Limit',
            orderStatus: 'New',
            qty: '0.001',
            cumExecQty: '0',
            price: '50000',
            createdTime: Date.now().toString(),
          },
          time: Date.now(),
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

      const response = await adapter.placeOrder(request)

      expect(response.symbol).toBe('BTCUSDT')
      expect(response.side).toBe('buy')
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should include API key and signature in headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 0,
          retMsg: 'OK',
          result: {
            orderId: '12345',
            symbol: 'BTCUSDT',
            side: 'Buy',
            orderType: 'Market',
            orderStatus: 'New',
            qty: '0.001',
            cumExecQty: '0',
            createdTime: Date.now().toString(),
          },
          time: Date.now(),
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

      expect(headers['X-BAPI-API-KEY']).toBe(mockBybitCredentials.apiKey)
      expect(headers['X-BAPI-SIGN']).toBeDefined()
      expect(headers['X-BAPI-TIMESTAMP']).toBeDefined()
    })
  })

  describe('getBalance', () => {
    it('should return formatted balance response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [
              {
                coin: [
                  {
                    coin: 'USDT',
                    walletBalance: '1000',
                    availableBalance: '1000',
                    locked: '0',
                  },
                  {
                    coin: 'BTC',
                    walletBalance: '0.1',
                    availableBalance: '0.1',
                    locked: '0',
                  },
                ],
              },
            ],
          },
          time: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.getBalance()

      expect(response.balances).toHaveLength(2)
      expect(response.balances[0].asset).toBe('USDT')
      expect(response.balances[0].total).toBe('1000')
      expect(response.timestamp).toBeDefined()
    })

    it('should return empty array when no balances', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 0,
          retMsg: 'OK',
          result: {
            list: [],
          },
          time: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.getBalance()

      expect(response.balances).toHaveLength(0)
    })
  })

  describe('cancelOrder', () => {
    it('should send cancel request with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 0,
          retMsg: 'OK',
          result: {
            orderId: '12345',
            symbol: 'BTCUSDT',
            side: 'Buy',
            orderType: 'Limit',
            orderStatus: 'Cancelled',
            qty: '0.001',
            cumExecQty: '0',
            createdTime: Date.now().toString(),
          },
          time: Date.now(),
        }),
      })

      global.fetch = mockFetch

      const response = await adapter.cancelOrder('12345', 'BTCUSDT')

      expect(response.orderId).toBe('12345')
      expect(response.status).toBe('cancelled')
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('getOrder', () => {
    it('should retrieve order details', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          retCode: 0,
          retMsg: 'OK',
          result: {
            orderId: '12345',
            symbol: 'BTCUSDT',
            side: 'Buy',
            orderType: 'Limit',
            orderStatus: 'Filled',
            qty: '0.001',
            cumExecQty: '0.001',
            avgPrice: '50000',
            createdTime: Date.now().toString(),
          },
          time: Date.now(),
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
