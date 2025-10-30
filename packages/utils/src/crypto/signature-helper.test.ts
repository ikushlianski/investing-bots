import { describe, it, expect } from 'vitest'
import { createHmacSha256Signature, createQueryString } from './signature-helper'

describe('signature-helper', () => {
  describe('createHmacSha256Signature', () => {
    it('should create valid HMAC SHA256 signature', async () => {
      const secret = 'test-secret'
      const data = 'test-data'

      const signature = await createHmacSha256Signature(secret, data)

      expect(signature).toBeDefined()
      expect(typeof signature).toBe('string')
      expect(signature.length).toBe(64)
    })

    it('should produce consistent signatures for same input', async () => {
      const secret = 'test-secret'
      const data = 'test-data'

      const signature1 = await createHmacSha256Signature(secret, data)
      const signature2 = await createHmacSha256Signature(secret, data)

      expect(signature1).toBe(signature2)
    })

    it('should produce different signatures for different inputs', async () => {
      const secret = 'test-secret'

      const signature1 = await createHmacSha256Signature(secret, 'data1')
      const signature2 = await createHmacSha256Signature(secret, 'data2')

      expect(signature1).not.toBe(signature2)
    })
  })

  describe('createQueryString', () => {
    it('should create query string from params', () => {
      const params = {
        symbol: 'BTCUSDT',
        side: 'BUY',
        timestamp: 1234567890,
      }

      const queryString = createQueryString(params)

      expect(queryString).toBe('symbol=BTCUSDT&side=BUY&timestamp=1234567890')
    })

    it('should filter out undefined values', () => {
      const params = {
        symbol: 'BTCUSDT',
        side: 'BUY',
        price: undefined,
      }

      const queryString = createQueryString(params)

      expect(queryString).toBe('symbol=BTCUSDT&side=BUY')
      expect(queryString).not.toContain('price')
    })

    it('should handle empty params object', () => {
      const queryString = createQueryString({})

      expect(queryString).toBe('')
    })

    it('should handle numeric values', () => {
      const params = {
        quantity: 0.001,
        timestamp: 1234567890,
      }

      const queryString = createQueryString(params)

      expect(queryString).toBe('quantity=0.001&timestamp=1234567890')
    })
  })
})
