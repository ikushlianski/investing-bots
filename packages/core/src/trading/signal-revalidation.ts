import type { SignalType, Candle, Indicators, MarketData } from './types'

export interface SignalRevalidationResult {
  isValid: boolean
  reason?: string
}

export function checkSignalStillValid(
  signalType: SignalType,
  firedAt: string,
  value: number | null,
  marketData: MarketData
): SignalRevalidationResult {
  switch (signalType) {
    case 'RSI_OVERBOUGHT':
      return revalidateRSIOverbought(marketData.indicators)

    case 'RSI_OVERSOLD':
      return revalidateRSIOversold(marketData.indicators)

    case 'VOLUME_SPIKE':
      return revalidateVolumeSpike(marketData.candle, marketData.indicators)

    case 'VOLUME_DECLINE':
      return revalidateVolumeDecline(marketData.candle, marketData.indicators)

    case 'REJECTION_WICK':
      return revalidateRejectionWick(marketData.recentCandles ?? [marketData.candle])

    case 'PRICE_LEVEL_BREAK':
      return { isValid: true }

    case 'MACD_DIVERGENCE':
      return revalidateMACDDivergence(firedAt, marketData.indicators)

    case 'TREND_ALIGNMENT':
      return revalidateTrendAlignment(value, marketData.indicators)

    case 'PRICE_IN_ENTRY_ZONE':
      return { isValid: true }

    default:
      return { isValid: true }
  }
}

export function revalidateRSIOverbought(indicators: Indicators): SignalRevalidationResult {
  if (!indicators.rsi) {
    return { isValid: false, reason: 'RSI data not available' }
  }

  if (indicators.rsi > 65) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'RSI no longer overbought' }
}

export function revalidateRSIOversold(indicators: Indicators): SignalRevalidationResult {
  if (!indicators.rsi) {
    return { isValid: false, reason: 'RSI data not available' }
  }

  if (indicators.rsi < 35) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'RSI no longer oversold' }
}

export function revalidateVolumeSpike(
  candle: Candle,
  indicators: Indicators
): SignalRevalidationResult {
  if (!indicators.volumeMA20) {
    return { isValid: false, reason: 'Volume MA data not available' }
  }

  const volumeRatio = candle.volume / indicators.volumeMA20

  if (volumeRatio > 1.3) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'Volume no longer elevated' }
}

export function revalidateVolumeDecline(
  candle: Candle,
  indicators: Indicators
): SignalRevalidationResult {
  if (!indicators.volumeMA20) {
    return { isValid: false, reason: 'Volume MA data not available' }
  }

  const volumeRatio = candle.volume / indicators.volumeMA20

  if (volumeRatio < 0.7) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'Volume no longer declining' }
}

export function revalidateRejectionWick(candles: Candle[]): SignalRevalidationResult {
  if (candles.length === 0) {
    return { isValid: false, reason: 'No candles provided' }
  }

  const recentCandles = candles.slice(-3)
  const hasRejection = recentCandles.some((candle) => hasRejectionPattern(candle))

  if (hasRejection) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'Rejection pattern no longer present' }
}

function hasRejectionPattern(candle: Candle): boolean {
  const upperWick = candle.high - Math.max(candle.open, candle.close)
  const lowerWick = Math.min(candle.open, candle.close) - candle.low

  const totalRange = candle.high - candle.low

  if (totalRange === 0) return false

  const upperWickRatio = upperWick / totalRange
  const lowerWickRatio = lowerWick / totalRange

  return upperWickRatio > 0.6 || lowerWickRatio > 0.6
}

export function revalidateMACDDivergence(
  firedAt: string,
  _indicators: Indicators
): SignalRevalidationResult {
  const ageHours = (Date.now() - new Date(firedAt).getTime()) / (1000 * 60 * 60)

  if (ageHours > 8) {
    return { isValid: false, reason: 'MACD divergence signal too old' }
  }

  return { isValid: true }
}

export function revalidateTrendAlignment(
  expectedTrendValue: number | null,
  indicators: Indicators
): SignalRevalidationResult {
  if (!indicators.ema20 || !indicators.ema50) {
    return { isValid: false, reason: 'EMA data not available' }
  }

  const currentTrend = indicators.ema20 > indicators.ema50 ? 1 : -1

  if (expectedTrendValue === null || currentTrend === expectedTrendValue) {
    return { isValid: true }
  }

  return { isValid: false, reason: 'Trend alignment changed' }
}
