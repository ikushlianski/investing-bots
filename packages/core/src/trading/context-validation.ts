import type { SetupDirection, MarketRegimeType } from './types'

export interface MarketRegime {
  id: number
  regimeType: MarketRegimeType
  trendStrength: number | null
  priceVsMa: number | null
  volatility: number | null
  stillActive: boolean
}

export interface PriceLevel {
  id: number
  price: number
  levelType: 'RESISTANCE' | 'SUPPORT'
  strength: number
  tests: number
  stillValid: boolean
}

export interface ContextValidationResult {
  valid: boolean
  reason?: string
}

export function checkDailyTrendAlignment(
  setupDirection: SetupDirection,
  dailyRegime: MarketRegime
): ContextValidationResult {
  if (setupDirection === 'SHORT') {
    if (dailyRegime.regimeType === 'TRENDING_UP') {
      return {
        valid: false,
        reason: 'Cannot short in strong daily uptrend',
      }
    }

    if (dailyRegime.regimeType === 'TRENDING_DOWN' || dailyRegime.regimeType === 'RANGING') {
      return { valid: true }
    }
  }

  if (setupDirection === 'LONG') {
    if (dailyRegime.regimeType === 'TRENDING_DOWN') {
      return {
        valid: false,
        reason: 'Cannot long in strong daily downtrend',
      }
    }

    if (dailyRegime.regimeType === 'TRENDING_UP' || dailyRegime.regimeType === 'RANGING') {
      return { valid: true }
    }
  }

  return { valid: true }
}

export function checkPriceLevelStrength(
  priceLevel: PriceLevel | null,
  minStrength: number = 2
): ContextValidationResult {
  if (!priceLevel) {
    return {
      valid: false,
      reason: 'Price level not found',
    }
  }

  if (!priceLevel.stillValid) {
    return {
      valid: false,
      reason: 'Price level no longer valid',
    }
  }

  if (priceLevel.strength < minStrength) {
    return {
      valid: false,
      reason: `Price level strength ${priceLevel.strength} below minimum ${minStrength}`,
    }
  }

  return { valid: true }
}

export function checkContextRegimeStillValid(
  setupContextRegimeId: number,
  currentContextRegime: MarketRegime
): ContextValidationResult {
  if (setupContextRegimeId !== currentContextRegime.id) {
    return {
      valid: false,
      reason: 'Context regime has changed',
    }
  }

  if (!currentContextRegime.stillActive) {
    return {
      valid: false,
      reason: 'Context regime no longer active',
    }
  }

  return { valid: true }
}

export function checkVolatilityNormal(
  currentVolatility: number,
  normalVolatility: number,
  maxSpikeMultiplier: number = 2.0
): ContextValidationResult {
  if (currentVolatility > normalVolatility * maxSpikeMultiplier) {
    return {
      valid: false,
      reason: `Volatility spike detected: ${(currentVolatility / normalVolatility).toFixed(2)}x normal`,
    }
  }

  return { valid: true }
}
