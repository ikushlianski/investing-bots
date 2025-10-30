export type RequestPriority = 'critical' | 'high' | 'normal' | 'low'

export interface RateLimiterConfig {
  maxTokens: number
  refillRate: number
  refillIntervalMs: number
}

export interface QueuedRequest<T> {
  id: string
  priority: RequestPriority
  weight: number
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
}

export interface RateLimiterStats {
  availableTokens: number
  maxTokens: number
  queueSize: number
  totalProcessed: number
  totalRejected: number
}

export const EXCHANGE_RATE_LIMITS = {
  binance: {
    maxTokens: 6000,
    refillRate: 100,
    refillIntervalMs: 1000,
  },
  bybit: {
    maxTokens: 600,
    refillRate: 10,
    refillIntervalMs: 1000,
  },
} as const

export const PRIORITY_VALUES: Record<RequestPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
}
