import { SetupDirection } from './setups/enums'
import { MarketRegimeType } from './regimes/enums'

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
  if (dailyRegime.regimeType === MarketRegimeType.DEAD) {
    return {
      valid: false,
      reason: 'Cannot trade in dead regime',
    }
  }

  if (dailyRegime.regimeType === MarketRegimeType.VOLATILE) {
    return {
      valid: false,
      reason: 'Cannot trade in volatile regime',
    }
  }

  if (setupDirection === SetupDirection.SHORT) {
    if (dailyRegime.regimeType === MarketRegimeType.TRENDING_UP) {
      return {
        valid: false,
        reason: 'Cannot short in strong daily uptrend',
      }
    }

    if (dailyRegime.regimeType === MarketRegimeType.TRENDING_DOWN || dailyRegime.regimeType === MarketRegimeType.RANGING) {
      return { valid: true }
    }
  }

  if (setupDirection === SetupDirection.LONG) {
    if (dailyRegime.regimeType === MarketRegimeType.TRENDING_DOWN) {
      return {
        valid: false,
        reason: 'Cannot long in strong daily downtrend',
      }
    }

    if (dailyRegime.regimeType === MarketRegimeType.TRENDING_UP || dailyRegime.regimeType === MarketRegimeType.RANGING) {
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
