import type { SignalType, Timeframe } from './types'

export interface SignalAgeLimits {
  maxAgeHours: number
  recheckIntervalHours: number
}

export function getSignalAgeLimits(
  signalType: SignalType,
  timeframe: Timeframe
): SignalAgeLimits {
  if (timeframe === '1h') {
    switch (signalType) {
      case 'RSI_OVERBOUGHT':
      case 'RSI_OVERSOLD':
        return { maxAgeHours: 2, recheckIntervalHours: 1 }
      case 'VOLUME_SPIKE':
        return { maxAgeHours: 1, recheckIntervalHours: 1 }
      case 'VOLUME_DECLINE':
        return { maxAgeHours: 2, recheckIntervalHours: 1 }
      case 'REJECTION_WICK':
        return { maxAgeHours: 1, recheckIntervalHours: 1 }
      case 'PRICE_LEVEL_BREAK':
        return { maxAgeHours: 0.25, recheckIntervalHours: 0.25 }
      case 'MACD_DIVERGENCE':
        return { maxAgeHours: 4, recheckIntervalHours: 1 }
      case 'TREND_ALIGNMENT':
        return { maxAgeHours: 12, recheckIntervalHours: 4 }
      case 'PRICE_IN_ENTRY_ZONE':
        return { maxAgeHours: 2, recheckIntervalHours: 0.5 }
      default:
        return { maxAgeHours: 4, recheckIntervalHours: 1 }
    }
  } else {
    switch (signalType) {
      case 'RSI_OVERBOUGHT':
      case 'RSI_OVERSOLD':
        return { maxAgeHours: 8, recheckIntervalHours: 4 }
      case 'VOLUME_SPIKE':
        return { maxAgeHours: 4, recheckIntervalHours: 4 }
      case 'VOLUME_DECLINE':
        return { maxAgeHours: 8, recheckIntervalHours: 4 }
      case 'REJECTION_WICK':
        return { maxAgeHours: 4, recheckIntervalHours: 4 }
      case 'PRICE_LEVEL_BREAK':
        return { maxAgeHours: 1, recheckIntervalHours: 1 }
      case 'MACD_DIVERGENCE':
        return { maxAgeHours: 16, recheckIntervalHours: 4 }
      case 'TREND_ALIGNMENT':
        return { maxAgeHours: 48, recheckIntervalHours: 4 }
      case 'PRICE_IN_ENTRY_ZONE':
        return { maxAgeHours: 8, recheckIntervalHours: 2 }
      default:
        return { maxAgeHours: 16, recheckIntervalHours: 4 }
    }
  }
}

export function isSignalStillValid(
  signalType: SignalType,
  ageHours: number,
  timeframe: Timeframe
): boolean {
  const limits = getSignalAgeLimits(signalType, timeframe)

  return ageHours < limits.maxAgeHours
}

export function shouldRecheckSignal(
  signalType: SignalType,
  lastRecheckHoursAgo: number,
  timeframe: Timeframe
): boolean {
  const limits = getSignalAgeLimits(signalType, timeframe)

  return lastRecheckHoursAgo >= limits.recheckIntervalHours
}

