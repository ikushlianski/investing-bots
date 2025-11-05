export interface PositionManagementConfig {
  maxHoldHours1h: number
  maxHoldHours4h: number
  breakevenThresholdPercent: number
  trailingStopThresholdPercent: number
  trailingStopDistancePercent: number
}

export const DEFAULT_POSITION_CONFIG: PositionManagementConfig = {
  maxHoldHours1h: 24,
  maxHoldHours4h: 72,
  breakevenThresholdPercent: 0.03,
  trailingStopThresholdPercent: 0.05,
  trailingStopDistancePercent: 0.02,
}

export function shouldMoveStopToBreakeven(
  pnlPercent: number,
  config: PositionManagementConfig = DEFAULT_POSITION_CONFIG
): boolean {
  return pnlPercent > config.breakevenThresholdPercent
}

export function shouldEnableTrailingStop(
  pnlPercent: number,
  config: PositionManagementConfig = DEFAULT_POSITION_CONFIG
): boolean {
  return pnlPercent > config.trailingStopThresholdPercent
}

export function calculateTrailingStopPrice(
  currentPrice: number,
  direction: 'LONG' | 'SHORT',
  config: PositionManagementConfig = DEFAULT_POSITION_CONFIG
): number {
  const distance = currentPrice * config.trailingStopDistancePercent

  return direction === 'SHORT' ? currentPrice + distance : currentPrice - distance
}

export function shouldClosePositionDueToTimeout(
  holdHours: number,
  timeframe: '1h' | '4h',
  pnlPercent: number,
  config: PositionManagementConfig = DEFAULT_POSITION_CONFIG
): boolean {
  const maxHold = timeframe === '1h' ? config.maxHoldHours1h : config.maxHoldHours4h

  return holdHours > maxHold && pnlPercent < 0.10
}

