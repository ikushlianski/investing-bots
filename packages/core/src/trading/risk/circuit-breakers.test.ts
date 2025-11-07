import { describe, it, expect } from 'vitest'
import {
  evaluateCircuitBreakers,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from './circuit-breakers'

describe('evaluateCircuitBreakers', () => {
  const baseSnapshot = {
    dailyLossPercent: 0.02,
    volatilityMultiplier: 1.2,
    consecutiveLosses: 1,
    apiErrorCount: 0,
    flashCrashDetected: false,
    connectivityStable: true,
  }

  it('should request pause when daily loss exceeds threshold', () => {
    const result = evaluateCircuitBreakers(
      {
        ...baseSnapshot,
        dailyLossPercent: DEFAULT_CIRCUIT_BREAKER_CONFIG.dailyLossPausePercent + 0.01,
      },
      DEFAULT_CIRCUIT_BREAKER_CONFIG
    )

    expect(result.shouldPause).toBe(true)
  })

  it('should request flatten when flash crash detected', () => {
    const result = evaluateCircuitBreakers(
      {
        ...baseSnapshot,
        flashCrashDetected: true,
      },
      DEFAULT_CIRCUIT_BREAKER_CONFIG
    )

    expect(result.shouldFlatten).toBe(true)
  })

  it('should include volatility todo when multiplier exceeds limit', () => {
    const result = evaluateCircuitBreakers(
      {
        ...baseSnapshot,
        volatilityMultiplier: DEFAULT_CIRCUIT_BREAKER_CONFIG.volatilityMultiplierLimit + 0.5,
      },
      DEFAULT_CIRCUIT_BREAKER_CONFIG
    )

    expect(result.todos.some((todo) => todo.id === 'TODO_VOLATILITY_FEED')).toBe(true)
  })
})
