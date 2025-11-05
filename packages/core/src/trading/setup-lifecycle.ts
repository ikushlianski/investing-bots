import type { SetupConfig, SetupState, Timeframe } from './types'

export function createResistanceRejectionSetup(
  symbol: string,
  resistanceLevel: number,
  entryTimeframe: Timeframe,
  contextTimeframe: Timeframe | null
): SetupConfig | null {
  return {
    symbol,
    entryTimeframe,
    contextTimeframe,
    setupType: 'RESISTANCE_REJECTION',
    direction: 'SHORT',
    entryZoneLow: resistanceLevel * 0.998,
    entryZoneHigh: resistanceLevel * 1.002,
    stopLoss: resistanceLevel * 1.04,
    takeProfit1: resistanceLevel * 0.93,
    takeProfit2: resistanceLevel * 0.87,
    requiredConfirmations: 3,
    ttl: getTTLForSetup('RESISTANCE_REJECTION', entryTimeframe),
  }
}

export function getTTLForSetup(
  setupType: string,
  timeframe: Timeframe
): { formingDurationMinutes: number; activeDurationMinutes: number; totalTTLMinutes: number } {
  if (timeframe === '1h') {
    switch (setupType) {
      case 'RESISTANCE_REJECTION':
        return { formingDurationMinutes: 180, activeDurationMinutes: 420, totalTTLMinutes: 600 }
      case 'SUPPORT_BREAKDOWN':
        return { formingDurationMinutes: 90, activeDurationMinutes: 300, totalTTLMinutes: 390 }
      case 'RETEST_SHORT':
        return { formingDurationMinutes: 45, activeDurationMinutes: 180, totalTTLMinutes: 225 }
      case 'TREND_CONTINUATION':
        return { formingDurationMinutes: 300, activeDurationMinutes: 900, totalTTLMinutes: 1200 }
      case 'MEAN_REVERSION':
        return { formingDurationMinutes: 150, activeDurationMinutes: 600, totalTTLMinutes: 750 }
      default:
        return { formingDurationMinutes: 180, activeDurationMinutes: 420, totalTTLMinutes: 600 }
    }
  } else {
    switch (setupType) {
      case 'RESISTANCE_REJECTION':
        return { formingDurationMinutes: 600, activeDurationMinutes: 1800, totalTTLMinutes: 2400 }
      case 'SUPPORT_BREAKDOWN':
        return { formingDurationMinutes: 300, activeDurationMinutes: 1200, totalTTLMinutes: 1500 }
      case 'RETEST_SHORT':
        return { formingDurationMinutes: 150, activeDurationMinutes: 900, totalTTLMinutes: 1050 }
      case 'TREND_CONTINUATION':
        return { formingDurationMinutes: 1200, activeDurationMinutes: 3600, totalTTLMinutes: 4800 }
      case 'MEAN_REVERSION':
        return { formingDurationMinutes: 600, activeDurationMinutes: 2400, totalTTLMinutes: 3000 }
      default:
        return { formingDurationMinutes: 600, activeDurationMinutes: 1800, totalTTLMinutes: 2400 }
    }
  }
}

export function evaluateSetupState(
  setupState: SetupState,
  currentPrice: number,
  entryZoneLow: number,
  entryZoneHigh: number,
  requiredConfirmations: number,
  signalCount: number,
  minutesSinceCreation: number,
  formingDurationMinutes: number
): SetupState {
  if (setupState === 'FORMING') {
    const inEntryZone = currentPrice >= entryZoneLow && currentPrice <= entryZoneHigh
    const formingTimeElapsed = minutesSinceCreation >= formingDurationMinutes

    if (inEntryZone && formingTimeElapsed && signalCount >= 2) {
      return 'ACTIVE'
    }
  }

  if (setupState === 'ACTIVE') {
    const inEntryZone = currentPrice >= entryZoneLow && currentPrice <= entryZoneHigh

    if (inEntryZone && signalCount >= requiredConfirmations) {
      return 'TRIGGERED'
    }
  }

  return setupState
}

export function shouldInvalidateSetup(
  currentPrice: number,
  entryZoneLow: number,
  entryZoneHigh: number,
  direction: 'LONG' | 'SHORT',
  minutesSinceActivation: number
): { shouldInvalidate: boolean; reason: string | null } {
  if (currentPrice < entryZoneLow * 0.97) {
    return { shouldInvalidate: true, reason: 'PRICE_MOVED_TOO_LOW' }
  }

  if (direction === 'SHORT' && currentPrice > entryZoneHigh * 1.03) {
    return { shouldInvalidate: true, reason: 'RESISTANCE_BROKEN' }
  }

  if (direction === 'LONG' && currentPrice < entryZoneLow * 0.97) {
    return { shouldInvalidate: true, reason: 'SUPPORT_BROKEN' }
  }

  const inEntryZone = currentPrice >= entryZoneLow && currentPrice <= entryZoneHigh

  if (!inEntryZone && minutesSinceActivation > 120) {
    return { shouldInvalidate: true, reason: 'LEFT_ENTRY_ZONE_TOO_LONG' }
  }

  return { shouldInvalidate: false, reason: null }
}

