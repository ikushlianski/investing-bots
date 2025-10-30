import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TokenBucket } from './token-bucket'
import type { RateLimiterConfig } from './types'

describe('TokenBucket', () => {
  let tokenBucket: TokenBucket
  const config: RateLimiterConfig = {
    maxTokens: 100,
    refillRate: 10,
    refillIntervalMs: 100,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    tokenBucket = new TokenBucket(config)
  })

  afterEach(() => {
    tokenBucket.stop()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should start with maximum tokens', () => {
      expect(tokenBucket.getAvailableTokens()).toBe(100)
    })

    it('should return correct stats', () => {
      const stats = tokenBucket.getStats()

      expect(stats.availableTokens).toBe(100)
      expect(stats.maxTokens).toBe(100)
      expect(stats.totalProcessed).toBe(0)
      expect(stats.totalRejected).toBe(0)
    })
  })

  describe('tryConsume', () => {
    it('should consume tokens when available', () => {
      const result = tokenBucket.tryConsume(10)

      expect(result).toBe(true)
      expect(tokenBucket.getAvailableTokens()).toBe(90)
    })

    it('should reject when insufficient tokens', () => {
      const result = tokenBucket.tryConsume(101)

      expect(result).toBe(false)
      expect(tokenBucket.getAvailableTokens()).toBe(100)
    })

    it('should track successful consumption', () => {
      tokenBucket.tryConsume(10)
      tokenBucket.tryConsume(20)

      const stats = tokenBucket.getStats()

      expect(stats.totalProcessed).toBe(2)
      expect(stats.totalRejected).toBe(0)
    })

    it('should track rejected consumption', () => {
      tokenBucket.tryConsume(101)
      tokenBucket.tryConsume(101)

      const stats = tokenBucket.getStats()

      expect(stats.totalProcessed).toBe(0)
      expect(stats.totalRejected).toBe(2)
    })
  })

  describe('refill', () => {
    it('should refill tokens over time', () => {
      tokenBucket.tryConsume(50)
      expect(tokenBucket.getAvailableTokens()).toBe(50)

      vi.advanceTimersByTime(100)

      expect(tokenBucket.getAvailableTokens()).toBe(60)
    })

    it('should not exceed maximum tokens', () => {
      vi.advanceTimersByTime(1000)

      expect(tokenBucket.getAvailableTokens()).toBe(100)
    })

    it('should refill multiple times', () => {
      tokenBucket.tryConsume(80)
      expect(tokenBucket.getAvailableTokens()).toBe(20)

      vi.advanceTimersByTime(500)

      expect(tokenBucket.getAvailableTokens()).toBe(70)
    })
  })

  describe('stop', () => {
    it('should stop refilling after stop', () => {
      tokenBucket.tryConsume(50)

      const beforeStop = tokenBucket.getAvailableTokens()

      tokenBucket.stop()

      vi.advanceTimersByTime(1000)

      expect(tokenBucket.getAvailableTokens()).toBe(beforeStop)
    })
  })
})
