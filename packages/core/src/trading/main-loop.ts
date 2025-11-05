import { isNewCandleClosed, getMinutesSince } from './candle-detection'
import { checkSignalStillValid } from './signal-revalidation'
import { checkContextRegimeStillValid, type MarketRegime } from './context-validation'
import { evaluateSetupState, shouldInvalidateSetup } from './setup-lifecycle'
import type { Timeframe, SetupState, MarketData, SignalType } from './types'

export interface Database {
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>
  execute: (sql: string, params?: unknown[]) => Promise<void>
}

export interface Exchange {
  getCurrentPrice: (instrumentId: number) => Promise<number>
  fetchLatestCandle: (instrumentId: number, timeframe: Timeframe) => Promise<unknown>
  getAccountBalance: () => Promise<number>
  placeOrder: (order: unknown) => Promise<unknown>
  placeStopLoss: (instrumentId: number, stopLoss: number, quantity: number) => Promise<void>
  placeTakeProfit: (instrumentId: number, takeProfit: number, quantity: number) => Promise<void>
  updateStopLoss: (instrumentId: number, newStop: number) => Promise<void>
  closePosition: (instrumentId: number) => Promise<void>
}

export interface TradingLoopConfig {
  enableTrading: boolean
  maxConcurrentSetups: number
  maxConcurrentTrades: number
  riskPerTradePercent: number
  pauseOnVolatilitySpike: boolean
  volatilitySpikeMultiplier: number
}

export const DEFAULT_LOOP_CONFIG: TradingLoopConfig = {
  enableTrading: true,
  maxConcurrentSetups: 10,
  maxConcurrentTrades: 5,
  riskPerTradePercent: 0.01,
  pauseOnVolatilitySpike: true,
  volatilitySpikeMultiplier: 2.0,
}

export async function runTradingLoop(
  db: Database,
  exchange: Exchange,
  config: TradingLoopConfig = DEFAULT_LOOP_CONFIG
): Promise<void> {
  const currentTime = new Date()

  if (isNewCandleClosed('1h', currentTime)) {
    await processNewCandle(db, exchange, '1h', currentTime)
  }

  if (isNewCandleClosed('4h', currentTime)) {
    await processNewCandle(db, exchange, '4h', currentTime)
  }

  if (isNewCandleClosed('1d', currentTime)) {
    await processNewCandle(db, exchange, '1d', currentTime)
  }

  await updateRegimesIfNeeded(db)

  if (await shouldPauseTrading(db, config)) {
    console.log('[TRADING LOOP] Trading paused due to safety check')

    return
  }

  await expireOldSetups(db, currentTime)
  await checkSetupInvalidations(db, exchange)
  await revalidateSignals(db, exchange)
  await evaluateActiveSetups(db, exchange, config)

  if (await canCreateNewSetups(db, config)) {
    await scanForNewSetups(db, exchange)
  }

  await manageOpenPositions(db, exchange)
}

async function processNewCandle(
  db: Database,
  exchange: Exchange,
  timeframe: Timeframe,
  currentTime: Date
): Promise<void> {
  console.log(`[TRADING LOOP] New ${timeframe} candle closed at ${currentTime.toISOString()}`)

  const instruments = await getActiveInstruments(db)

  for (const instrument of instruments) {
    const candle = await exchange.fetchLatestCandle(instrument.id, timeframe)

    await storeCandle(db, instrument.id, timeframe, candle)
    await updateIndicators(db, instrument.id, timeframe)
    await updatePriceLevels(db, instrument.id, timeframe)
    await updateMarketRegime(db, instrument.id, timeframe)
    await checkAndFireSignals(db, instrument.id, timeframe)
    await incrementSetupCandleCounts(db, instrument.id, timeframe, currentTime)
  }
}

function getActiveInstruments(_db: Database): Promise<{ id: number; symbol: string }[]> {
  return Promise.resolve([])
}

async function storeCandle(
  _db: Database,
  _instrumentId: number,
  _timeframe: Timeframe,
  _candle: unknown
): Promise<void> {}

async function updateIndicators(
  _db: Database,
  _instrumentId: number,
  _timeframe: Timeframe
): Promise<void> {}

async function updatePriceLevels(
  _db: Database,
  _instrumentId: number,
  _timeframe: Timeframe
): Promise<void> {}

async function updateMarketRegime(
  _db: Database,
  _instrumentId: number,
  _timeframe: Timeframe
): Promise<void> {}

async function checkAndFireSignals(
  _db: Database,
  _instrumentId: number,
  _timeframe: Timeframe
): Promise<void> {}

async function incrementSetupCandleCounts(
  _db: Database,
  _instrumentId: number,
  _timeframe: Timeframe,
  _currentTime: Date
): Promise<void> {}

async function updateRegimesIfNeeded(_db: Database): Promise<void> {}

async function shouldPauseTrading(
  db: Database,
  config: TradingLoopConfig
): Promise<boolean> {
  if (!config.enableTrading) {
    return true
  }

  if (config.pauseOnVolatilitySpike) {
    const currentVolatility = await getCurrentVolatility(db)
    const normalVolatility = await getNormalVolatility(db)

    if (currentVolatility > normalVolatility * config.volatilitySpikeMultiplier) {
      console.log(
        `[SAFETY] Pausing trading due to volatility spike: ${(currentVolatility / normalVolatility).toFixed(2)}x normal`
      )

      return true
    }
  }

  return false
}

function getCurrentVolatility(_db: Database): Promise<number> {
  return Promise.resolve(0.1)
}

function getNormalVolatility(_db: Database): Promise<number> {
  return Promise.resolve(0.1)
}

async function expireOldSetups(db: Database, currentTime: Date): Promise<void> {
  await db.execute(
    `
    UPDATE setups
    SET state = 'EXPIRED', invalidated_at = ?
    WHERE state IN ('FORMING', 'ACTIVE')
      AND expires_at < ?
  `,
    [currentTime.toISOString(), currentTime.toISOString()]
  )
}

async function checkSetupInvalidations(db: Database, exchange: Exchange): Promise<void> {
  const activeSetups = await db.query<{
    id: number
    instrumentId: number
    direction: 'LONG' | 'SHORT'
    entryZoneLow: number
    entryZoneHigh: number
    activatedAt: string | null
    contextRegimeId: number | null
    contextTimeframe: string | null
  }>(
    `
    SELECT id, instrument_id, direction, entry_zone_low, entry_zone_high,
           activated_at, context_regime_id, context_timeframe
    FROM setups
    WHERE state IN ('FORMING', 'ACTIVE')
  `
  )

  for (const setup of activeSetups) {
    const currentPrice = await exchange.getCurrentPrice(setup.instrumentId)

    const invalidation = shouldInvalidateSetup(
      currentPrice,
      setup.entryZoneLow,
      setup.entryZoneHigh,
      setup.direction,
      setup.activatedAt ? getMinutesSince(setup.activatedAt) : 0
    )

    if (invalidation.shouldInvalidate) {
      await invalidateSetup(db, setup.id, invalidation.reason!)
      continue
    }

    if (setup.contextRegimeId && setup.contextTimeframe) {
      const currentContextRegime = await getCurrentRegime(
        db,
        setup.instrumentId,
        setup.contextTimeframe as Timeframe
      )

      if (currentContextRegime) {
        const contextCheck = checkContextRegimeStillValid(setup.contextRegimeId, currentContextRegime)

        if (!contextCheck.valid) {
          await invalidateSetup(db, setup.id, 'CONTEXT_REGIME_CHANGED')
        }
      }
    }
  }
}

async function invalidateSetup(db: Database, setupId: number, reason: string): Promise<void> {
  await db.execute(
    `
    UPDATE setups
    SET state = 'INVALIDATED',
        invalidated_at = ?,
        invalidation_reason = ?
    WHERE id = ?
  `,
    [new Date().toISOString(), reason, setupId]
  )

  console.log(`[SETUP] Invalidated setup ${setupId}: ${reason}`)
}

async function getCurrentRegime(
  db: Database,
  instrumentId: number,
  timeframe: Timeframe
): Promise<MarketRegime | null> {
  const regimes = await db.query<MarketRegime>(
    `
    SELECT id, regime_type, trend_strength, price_vs_ma, volatility, still_active
    FROM market_regimes
    WHERE instrument_id = ? AND timeframe = ? AND still_active = 1
    ORDER BY started_at DESC
    LIMIT 1
  `,
    [instrumentId, timeframe]
  )

  return regimes[0] ?? null
}

async function revalidateSignals(db: Database, exchange: Exchange): Promise<void> {
  const signalsToRecheck = await db.query<{
    id: number
    setupId: number
    signalType: string
    firedAt: string
    value: number | null
    detectedOnTimeframe: string
    instrumentId: number
  }>(
    `
    SELECT s.id, s.setup_id, s.signal_type, s.fired_at, s.value, s.detected_on_timeframe,
           st.instrument_id
    FROM setup_signals s
    JOIN setups st ON s.setup_id = st.id
    WHERE s.still_valid = 1
      AND s.requires_recheck = 1
      AND st.state IN ('FORMING', 'ACTIVE')
  `
  )

  for (const signal of signalsToRecheck) {
    const marketData = await getMarketData(
      db,
      exchange,
      signal.instrumentId,
      signal.detectedOnTimeframe as Timeframe
    )
    const revalidation = checkSignalStillValid(
      signal.signalType as SignalType,
      signal.firedAt,
      signal.value,
      marketData
    )

    if (!revalidation.isValid) {
      await db.execute(
        `
        UPDATE setup_signals
        SET still_valid = 0, invalidated_at = ?
        WHERE id = ?
      `,
        [new Date().toISOString(), signal.id]
      )

      console.log(`[SIGNAL] Invalidated signal ${signal.id}: ${revalidation.reason}`)
    }

    await db.execute(
      `
      UPDATE setup_signals
      SET last_rechecked_at = ?
      WHERE id = ?
    `,
      [new Date().toISOString(), signal.id]
    )
  }
}

async function getMarketData(
  _db: Database,
  exchange: Exchange,
  instrumentId: number,
  _timeframe: Timeframe
): Promise<MarketData> {
  const price = await exchange.getCurrentPrice(instrumentId)

  return {
    price,
    candle: {
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString(),
    },
    indicators: {},
  }
}

async function evaluateActiveSetups(
  db: Database,
  exchange: Exchange,
  config: TradingLoopConfig
): Promise<void> {
  const activeSetups = await db.query<{
    id: number
    instrumentId: number
    state: string
    createdAt: string
    activatedAt: string | null
    entryZoneLow: number
    entryZoneHigh: number
    requiredConfirmations: number
    formingDurationMinutes: number
    direction: 'LONG' | 'SHORT'
  }>(
    `
    SELECT id, instrument_id, state, created_at, activated_at,
           entry_zone_low, entry_zone_high, required_confirmations,
           forming_duration_minutes, direction
    FROM setups
    WHERE state IN ('FORMING', 'ACTIVE')
  `
  )

  for (const setup of activeSetups) {
    const currentPrice = await exchange.getCurrentPrice(setup.instrumentId)
    const validSignals = await getValidSignalsCount(db, setup.id)
    const minutesSinceCreation = getMinutesSince(setup.createdAt)

    const newState = evaluateSetupState(
      setup.state as SetupState,
      currentPrice,
      setup.entryZoneLow,
      setup.entryZoneHigh,
      setup.requiredConfirmations,
      validSignals,
      minutesSinceCreation,
      setup.formingDurationMinutes
    )

    if (newState === 'ACTIVE' && setup.state === 'FORMING') {
      await db.execute(
        `
        UPDATE setups
        SET state = 'ACTIVE', activated_at = ?
        WHERE id = ?
      `,
        [new Date().toISOString(), setup.id]
      )

      console.log(`[SETUP] Setup ${setup.id} activated`)
    }

    if (newState === 'TRIGGERED' && setup.state === 'ACTIVE') {
      await triggerTrade(db, exchange, setup, config)
    }
  }
}

async function getValidSignalsCount(db: Database, setupId: number): Promise<number> {
  const result = await db.query<{ count: number }>(
    `
    SELECT COUNT(*) as count
    FROM setup_signals
    WHERE setup_id = ? AND still_valid = 1
  `,
    [setupId]
  )

  return result[0]?.count ?? 0
}

function triggerTrade(
  _db: Database,
  _exchange: Exchange,
  setup: { id: number; instrumentId: number; direction: 'LONG' | 'SHORT' },
  _config: TradingLoopConfig
): Promise<void> {
  console.log(`[TRADE] Triggering trade for setup ${setup.id}`)

  return Promise.resolve()
}

async function canCreateNewSetups(
  db: Database,
  config: TradingLoopConfig
): Promise<boolean> {
  const activeSetupsCount = await db.query<{ count: number }>(
    `
    SELECT COUNT(*) as count
    FROM setups
    WHERE state IN ('FORMING', 'ACTIVE')
  `
  )

  const count = activeSetupsCount[0]?.count ?? 0

  return count < config.maxConcurrentSetups
}

async function scanForNewSetups(_db: Database, _exchange: Exchange): Promise<void> {}

async function manageOpenPositions(_db: Database, _exchange: Exchange): Promise<void> {}
