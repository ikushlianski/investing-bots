import { describe, it, expect } from 'vitest'
import {
  evaluateRiskChecks,
  DEFAULT_RISK_CHECK_CONFIG,
  type RiskSnapshot,
} from './risk-checks'
import { Timeframe } from '../candles/enums'
import { SetupDirection } from '../setups/enums'
import { MarketRegimeType } from '../regimes/enums'

describe('evaluateRiskChecks', () => {
  const baseSnapshot: RiskSnapshot = {
    accountBalance: 100000,
    requestedRiskPercent: 0.01,
    requestedPositionSizePercent: 0.1,
    entryPrice: 100,
    stopPrice: 95,
    timeframe: Timeframe.ONE_HOUR,
    direction: SetupDirection.LONG,
    regime: MarketRegimeType.TRENDING_UP,
    dailyLossPercent: 0.01,
    openPositions: 1,
    correlatedExposureCount: 0,
    openRiskPercent: 0.01,
  }

  it('should block trade when requested risk exceeds max', () => {
    const result = evaluateRiskChecks(
      {
        ...baseSnapshot,
        requestedRiskPercent: DEFAULT_RISK_CHECK_CONFIG.maxRiskPerTradePercent * 1.5,
      },
      DEFAULT_RISK_CHECK_CONFIG
    )

    expect(result.isAllowed).toBe(false)
    expect(result.failures.some((failure) => failure.checkId === 'RISK_PER_TRADE')).toBe(true)
  })

  it('should include correlation todo when correlated exposure limit reached', () => {
    const result = evaluateRiskChecks(
      {
        ...baseSnapshot,
        correlatedExposureCount: DEFAULT_RISK_CHECK_CONFIG.maxCorrelatedPositions,
      },
      DEFAULT_RISK_CHECK_CONFIG
    )

    expect(result.isAllowed).toBe(false)
    expect(result.todos.some((todo) => todo.id === 'TODO_CORRELATION_MATRIX')).toBe(true)
  })

  it('should pass when snapshot within limits', () => {
    const result = evaluateRiskChecks(baseSnapshot, DEFAULT_RISK_CHECK_CONFIG)

    expect(result.isAllowed).toBe(true)
    expect(result.failures.length).toBe(0)
  })
})
