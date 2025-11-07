import { eq, and, desc } from 'drizzle-orm'
import type { MarketRegime } from '../context-validation'
import type { Timeframe as TimeframeType } from '../types'
import type { DrizzleDatabase } from '../database'

export async function getCurrentRegime(
  db: DrizzleDatabase,
  regimeTable: {
    id: unknown
    instrumentId: unknown
    timeframe: unknown
    stillActive: unknown
    regimeType: unknown
    trendStrength: unknown
    priceVsMa: unknown
    volatility: unknown
    startedAt: unknown
  },
  instrumentId: number,
  timeframe: TimeframeType
): Promise<MarketRegime | null> {
  const result = await db
    .select()
    .from(regimeTable)
    .where(
      and(
        eq(regimeTable.instrumentId, instrumentId),
        eq(regimeTable.timeframe, timeframe),
        eq(regimeTable.stillActive, true)
      )
    )
    .orderBy(desc(regimeTable.startedAt))
    .limit(1)
    .all()

  if (result.length === 0) {
    return null
  }

  const regime = result[0] as {
    id: number
    regimeType: string
    trendStrength: string | null
    priceVsMa: string | null
    volatility: string | null
    stillActive: boolean
  }

  return {
    id: regime.id,
    regimeType: regime.regimeType as MarketRegime['regimeType'],
    trendStrength: regime.trendStrength ? parseFloat(regime.trendStrength) : null,
    priceVsMa: regime.priceVsMa ? parseFloat(regime.priceVsMa) : null,
    volatility: regime.volatility ? parseFloat(regime.volatility) : null,
    stillActive: regime.stillActive,
  }
}

