import { Timeframe } from '../candles/enums'
import { MarketRegimeType } from '../regimes/enums'
import { SetupDirection } from '../setups/enums'

export interface RiskCheckConfig {
  maxRiskPerTradePercent: number
  maxPositionSizePercent: number
  maxDailyLossPercent: number
  maxConcurrentPositions: number
  maxCorrelatedPositions: number
  maxStopDistancePercent1h: number
  maxStopDistancePercent4h: number
  maxStopDistancePercent1d: number
}

export const DEFAULT_RISK_CHECK_CONFIG: RiskCheckConfig = {
  maxRiskPerTradePercent: 0.02,
  maxPositionSizePercent: 0.3,
  maxDailyLossPercent: 0.05,
  maxConcurrentPositions: 3,
  maxCorrelatedPositions: 2,
  maxStopDistancePercent1h: 0.05,
  maxStopDistancePercent4h: 0.08,
  maxStopDistancePercent1d: 0.1,
}

export interface RiskSnapshot {
  accountBalance: number
  requestedRiskPercent: number
  requestedPositionSizePercent: number
  entryPrice: number
  stopPrice: number
  timeframe: Timeframe
  direction: SetupDirection
  regime: MarketRegimeType
  dailyLossPercent: number
  openPositions: number
  correlatedExposureCount: number
  openRiskPercent: number
}

export interface RiskCheckFailure {
  checkId: string
  reason: string
}

export interface RiskTodo {
  id: string
  description: string
}

export interface RiskCheckResult {
  isAllowed: boolean
  failures: RiskCheckFailure[]
  riskAmount: number
  positionSizeUnits: number
  positionSizeNotionalPercent: number
  todos: RiskTodo[]
}

export function evaluateRiskChecks(
  snapshot: RiskSnapshot,
  config: RiskCheckConfig = DEFAULT_RISK_CHECK_CONFIG
): RiskCheckResult {
  const failures: RiskCheckFailure[] = []
  const todos: RiskTodo[] = []

  const riskPercent = Math.min(snapshot.requestedRiskPercent, config.maxRiskPerTradePercent)
  const riskAmount = snapshot.accountBalance * riskPercent
  const stopDistance = Math.abs(snapshot.entryPrice - snapshot.stopPrice)

  if (stopDistance === 0) {
    failures.push({
      checkId: 'STOP_DISTANCE',
      reason: 'Stop distance cannot be zero',
    })
  }

  const positionSizeUnits = stopDistance === 0 ? 0 : riskAmount / stopDistance
  const positionSizeNotionalPercent =
    snapshot.entryPrice === 0 ? 0 : (positionSizeUnits * snapshot.entryPrice) / snapshot.accountBalance

  if (snapshot.requestedRiskPercent > config.maxRiskPerTradePercent) {
    failures.push({
      checkId: 'RISK_PER_TRADE',
      reason: `Requested risk ${formatPercent(snapshot.requestedRiskPercent)} exceeds maximum ${formatPercent(
        config.maxRiskPerTradePercent
      )}`,
    })
  }

  if (snapshot.requestedPositionSizePercent > config.maxPositionSizePercent) {
    failures.push({
      checkId: 'POSITION_SIZE',
      reason: `Requested position size ${formatPercent(
        snapshot.requestedPositionSizePercent
      )} exceeds maximum ${formatPercent(config.maxPositionSizePercent)}`,
    })
  }

  if (snapshot.dailyLossPercent >= config.maxDailyLossPercent) {
    failures.push({
      checkId: 'DAILY_LOSS',
      reason: `Daily loss ${formatPercent(snapshot.dailyLossPercent)} breaches limit ${formatPercent(
        config.maxDailyLossPercent
      )}`,
    })
  }

  if (snapshot.openPositions >= config.maxConcurrentPositions) {
    failures.push({
      checkId: 'CONCURRENT_POSITIONS',
      reason: `Concurrent positions ${snapshot.openPositions} reaches limit ${config.maxConcurrentPositions}`,
    })
  }

  if (snapshot.correlatedExposureCount >= config.maxCorrelatedPositions) {
    failures.push({
      checkId: 'CORRELATION',
      reason: `Correlated positions ${snapshot.correlatedExposureCount} reaches limit ${config.maxCorrelatedPositions}`,
    })

    todos.push({
      id: 'TODO_CORRELATION_MATRIX',
      description: 'Integrate correlation matrix to compute correlatedExposureCount dynamically',
    })
  }

  const regimeAligned = isRegimeAligned(snapshot.direction, snapshot.regime)

  if (!regimeAligned) {
    failures.push({
      checkId: 'REGIME_ALIGNMENT',
      reason: `Direction ${snapshot.direction} misaligned with regime ${snapshot.regime}`,
    })
  }

  const stopDistancePercent = snapshot.entryPrice === 0 ? 0 : stopDistance / snapshot.entryPrice
  const maxStop = getMaxStopDistancePercent(snapshot.timeframe, config)

  if (stopDistancePercent > maxStop) {
    failures.push({
      checkId: 'STOP_DISTANCE',
      reason: `Stop distance ${formatPercent(stopDistancePercent)} exceeds maximum ${formatPercent(maxStop)}`,
    })
  }

  if (snapshot.openRiskPercent + riskPercent > config.maxRiskPerTradePercent * config.maxConcurrentPositions) {
    failures.push({
      checkId: 'PORTFOLIO_RISK',
      reason: `Total open risk ${formatPercent(snapshot.openRiskPercent + riskPercent)} exceeds allowed aggregate`,
    })
  }

  if (snapshot.regime === MarketRegimeType.VOLATILE) {
    todos.push({
      id: 'TODO_VOLATILITY_NORMALIZATION',
      description: 'Hook volatility feed to auto-toggle risk limits during volatile regimes',
    })
  }

  return {
    isAllowed: failures.length === 0,
    failures,
    riskAmount,
    positionSizeUnits,
    positionSizeNotionalPercent,
    todos,
  }
}

function getMaxStopDistancePercent(timeframe: Timeframe, config: RiskCheckConfig): number {
  if (timeframe === Timeframe.ONE_DAY) {
    return config.maxStopDistancePercent1d
  }

  if (timeframe === Timeframe.FOUR_HOURS) {
    return config.maxStopDistancePercent4h
  }

  return config.maxStopDistancePercent1h
}

function isRegimeAligned(direction: SetupDirection, regime: MarketRegimeType): boolean {
  if (regime === MarketRegimeType.VOLATILE || regime === MarketRegimeType.DEAD) {
    return false
  }

  if (regime === MarketRegimeType.TRENDING_UP && direction === SetupDirection.SHORT) {
    return false
  }

  if (regime === MarketRegimeType.TRENDING_DOWN && direction === SetupDirection.LONG) {
    return false
  }

  return true
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}
