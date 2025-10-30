import { describe, it, expect } from 'vitest'
import { getExchangeCredentials } from './credentials-provider'
import { ExchangeAuthenticationError } from './errors'

describe('credentials-provider', () => {
  describe('getExchangeCredentials', () => {
    it('should return valid Binance credentials', () => {
      const source = {
        BINANCE_API_KEY: 'test-key',
        BINANCE_API_SECRET: 'test-secret',
      }

      const credentials = getExchangeCredentials('binance', 'testnet', source)

      expect(credentials).toEqual({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        environment: 'testnet',
      })
    })

    it('should return valid Bybit credentials', () => {
      const source = {
        BYBIT_API_KEY: 'test-key',
        BYBIT_API_SECRET: 'test-secret',
      }

      const credentials = getExchangeCredentials('bybit', 'production', source)

      expect(credentials).toEqual({
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        environment: 'production',
      })
    })

    it('should throw error when API key is missing', () => {
      const source = {
        BINANCE_API_SECRET: 'test-secret',
      }

      expect(() => {
        getExchangeCredentials('binance', 'testnet', source)
      }).toThrow(ExchangeAuthenticationError)
    })

    it('should throw error when API secret is missing', () => {
      const source = {
        BINANCE_API_KEY: 'test-key',
      }

      expect(() => {
        getExchangeCredentials('binance', 'testnet', source)
      }).toThrow(ExchangeAuthenticationError)
    })

    it('should throw error with descriptive message', () => {
      const source = {}

      expect(() => {
        getExchangeCredentials('binance', 'testnet', source)
      }).toThrow(ExchangeAuthenticationError)

      try {
        getExchangeCredentials('binance', 'testnet', source)
      } catch (error) {
        if (error instanceof ExchangeAuthenticationError) {
          expect(error.originalError).toBeInstanceOf(Error)
          expect((error.originalError as Error).message).toContain(
            'Missing API credentials for binance',
          )
        }
      }
    })

    it('should validate credentials format', () => {
      const source = {
        BINANCE_API_KEY: '',
        BINANCE_API_SECRET: '',
      }

      expect(() => {
        getExchangeCredentials('binance', 'testnet', source)
      }).toThrow(ExchangeAuthenticationError)
    })
  })
})
