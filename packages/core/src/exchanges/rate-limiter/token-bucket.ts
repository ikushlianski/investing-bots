import type { RateLimiterConfig, RateLimiterStats } from './types'

export class TokenBucket {
  private tokens: number
  private lastRefill: number
  private refillInterval: NodeJS.Timeout | null = null
  private readonly config: RateLimiterConfig
  private totalProcessed = 0
  private totalRejected = 0

  constructor(config: RateLimiterConfig) {
    this.config = config
    this.tokens = config.maxTokens
    this.lastRefill = Date.now()
    this.startRefill()
  }

  private startRefill(): void {
    this.refillInterval = setInterval(() => {
      this.refill()
    }, this.config.refillIntervalMs)
  }

  private refill(): void {
    if (!this.refillInterval) {
      return
    }

    const now = Date.now()
    const timeSinceRefill = now - this.lastRefill

    if (timeSinceRefill >= this.config.refillIntervalMs) {
      this.tokens = Math.min(
        this.tokens + this.config.refillRate,
        this.config.maxTokens,
      )
      this.lastRefill = now
    }
  }

  tryConsume(weight: number): boolean {
    this.refill()

    if (this.tokens >= weight) {
      this.tokens -= weight
      this.totalProcessed++

      return true
    }

    this.totalRejected++

    return false
  }

  getAvailableTokens(): number {
    this.refill()

    return this.tokens
  }

  getStats(): Omit<RateLimiterStats, 'queueSize'> {
    return {
      availableTokens: this.getAvailableTokens(),
      maxTokens: this.config.maxTokens,
      totalProcessed: this.totalProcessed,
      totalRejected: this.totalRejected,
    }
  }

  stop(): void {
    if (this.refillInterval) {
      clearInterval(this.refillInterval)
      this.refillInterval = null
    }
  }
}
