import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new RateLimiter({
      maxTokens: 100,
      refillRate: 10,
      refillIntervalMs: 100,
      maxQueueSize: 50,
      queueCheckIntervalMs: 50,
    })
  })

  afterEach(() => {
    rateLimiter.stop()
    vi.useRealTimers()
  })

  describe('execute', () => {
    it('should execute request immediately when tokens available', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const promise = rateLimiter.execute(mockFn, 'normal', 1)

      await vi.advanceTimersByTimeAsync(100)

      const result = await promise

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledOnce()
    })

    it('should track queued requests in stats', () => {
      rateLimiter.execute(async () => 'test1', 'normal', 100)
      rateLimiter.execute(async () => 'test2', 'normal', 100)
      rateLimiter.execute(async () => 'test3', 'normal', 100)

      const stats = rateLimiter.getStats()

      expect(stats.queueSize).toBeGreaterThan(0)
    })

    it('should handle errors from executed functions', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Test error')
      })

      const executePromise = rateLimiter.execute(mockFn)

      let caughtError: Error | null = null

      executePromise.catch((error) => {
        caughtError = error
      })

      await vi.advanceTimersByTimeAsync(100)

      await executePromise.catch(() => {})

      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError?.message).toBe('Test error')
    })

    it('should reject when queue is full', async () => {
      const limiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 1,
        refillIntervalMs: 1000,
        maxQueueSize: 2,
      })

      limiter.execute(async () => 'first', 'normal', 1)
      limiter.execute(async () => 'second', 'normal', 1)
      limiter.execute(async () => 'third', 'normal', 1)

      await expect(
        limiter.execute(async () => 'fourth', 'normal', 1),
      ).rejects.toThrow('Rate limiter queue is full')

      limiter.stop()
    })
  })

  describe('getStats', () => {
    it('should return accurate stats', async () => {
      const initialStats = rateLimiter.getStats()

      expect(initialStats.availableTokens).toBe(100)
      expect(initialStats.maxTokens).toBe(100)
      expect(initialStats.queueSize).toBe(0)
      expect(initialStats.totalProcessed).toBe(0)

      rateLimiter.execute(async () => 'test', 'normal', 50)
      await vi.advanceTimersByTimeAsync(100)

      const afterStats = rateLimiter.getStats()

      expect(afterStats.availableTokens).toBeLessThan(100)
      expect(afterStats.totalProcessed).toBe(1)
    })

    it('should track queue size', () => {
      rateLimiter.execute(async () => 'test1', 'normal', 100)
      rateLimiter.execute(async () => 'test2', 'normal', 100)
      rateLimiter.execute(async () => 'test3', 'normal', 100)

      const stats = rateLimiter.getStats()

      expect(stats.queueSize).toBeGreaterThan(0)
    })
  })

  describe('stop', () => {
    it('should stop processing and clear queue', async () => {
      const mockFn = vi.fn().mockResolvedValue('test')

      rateLimiter.execute(mockFn, 'normal', 100)
      rateLimiter.execute(mockFn, 'normal', 100)

      rateLimiter.stop()

      await vi.advanceTimersByTimeAsync(1000)

      const stats = rateLimiter.getStats()

      expect(stats.queueSize).toBe(0)
    })
  })

  describe('concurrent requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        rateLimiter.execute(async () => `result-${i}`, 'normal', 5),
      )

      await vi.advanceTimersByTimeAsync(1000)

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result, i) => {
        expect(result).toBe(`result-${i}`)
      })
    })
  })
})
