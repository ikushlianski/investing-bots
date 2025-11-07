import type { RiskTodo } from './risk-checks'

export interface CircuitBreakerConfig {
  dailyLossPausePercent: number
  dailyLossFlattenPercent: number
  volatilityMultiplierLimit: number
  maxConsecutiveLosses: number
  maxApiErrors: number
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  dailyLossPausePercent: 0.05,
  dailyLossFlattenPercent: 0.07,
  volatilityMultiplierLimit: 2,
  maxConsecutiveLosses: 5,
  maxApiErrors: 3,
}

export interface CircuitBreakerSnapshot {
  dailyLossPercent: number
  volatilityMultiplier: number
  consecutiveLosses: number
  apiErrorCount: number
  flashCrashDetected: boolean
  connectivityStable: boolean
}

export interface CircuitBreakerResult {
  shouldPause: boolean
  shouldFlatten: boolean
  reasons: string[]
  todos: RiskTodo[]
}

export function evaluateCircuitBreakers(
  snapshot: CircuitBreakerSnapshot,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
): CircuitBreakerResult {
  const reasons: string[] = []
  const todos: RiskTodo[] = []

  let shouldPause = false
  let shouldFlatten = false

  if (snapshot.dailyLossPercent >= config.dailyLossFlattenPercent) {
    shouldPause = true
    shouldFlatten = true
    reasons.push(
      `Daily loss ${formatPercent(snapshot.dailyLossPercent)} breaches flatten threshold ${formatPercent(
        config.dailyLossFlattenPercent
      )}`
    )
  } else if (snapshot.dailyLossPercent >= config.dailyLossPausePercent) {
    shouldPause = true
    reasons.push(
      `Daily loss ${formatPercent(snapshot.dailyLossPercent)} breaches pause threshold ${formatPercent(
        config.dailyLossPausePercent
      )}`
    )
  }

  if (snapshot.volatilityMultiplier >= config.volatilityMultiplierLimit) {
    shouldPause = true
    reasons.push(
      `Volatility multiplier ${(snapshot.volatilityMultiplier).toFixed(2)} exceeds limit ${config.volatilityMultiplierLimit.toFixed(2)}`
    )

    todos.push({
      id: 'TODO_VOLATILITY_FEED',
      description: 'Connect real-time volatility feed to populate volatilityMultiplier',
    })
  }

  if (snapshot.consecutiveLosses >= config.maxConsecutiveLosses) {
    shouldPause = true
    reasons.push(
      `Consecutive losses ${snapshot.consecutiveLosses} reaches limit ${config.maxConsecutiveLosses}`
    )
  }

  if (snapshot.flashCrashDetected) {
    shouldPause = true
    shouldFlatten = true
    reasons.push('Flash crash detected')
  }

  if (!snapshot.connectivityStable) {
    shouldPause = true
    shouldFlatten = true
    reasons.push('Exchange connectivity instability detected')
  }

  if (snapshot.apiErrorCount >= config.maxApiErrors) {
    shouldPause = true
    reasons.push(`API errors ${snapshot.apiErrorCount} reaches limit ${config.maxApiErrors}`)
  }

  if (shouldFlatten) {
    todos.push({
      id: 'TODO_POSITION_FLATTENING',
      description: 'Implement position liquidator for circuit breaker flatten flow',
    })
  }

  return {
    shouldPause,
    shouldFlatten,
    reasons,
    todos,
  }
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}
