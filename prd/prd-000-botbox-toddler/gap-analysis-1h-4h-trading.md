---
updated: 2025-11-06
status: in-progress
---

# Gap Analysis: 1h-4h Trading System Requirements

## Executive Summary

The existing codebase has a solid foundation with proper database schema and core trading logic functions. However, several critical components are missing to support the complete 1h-4h algorithmic trading system as specified by the trader.

**Status:**
- Database Schema: 90% complete
- Trading Logic Functions: 70% complete
- Main Trading Loop: 0% missing
- Candle Detection: 0% missing
- Signal Revalidation: 0% missing
- Multi-Timeframe Context: 30% partial
- Position Management: 80% complete

## 1. Database Schema Analysis

### What Exists

**setups table** (apps/botbox/src/db/schema/setups.ts)
- Has all required fields matching trader specs
- Proper TTL tracking (formingDurationMinutes, activeDurationMinutes, candlesElapsed)
- Multi-timeframe support (entryTimeframe, contextTimeframe)
- Regime relationships (regimeId, contextRegimeId)
- State lifecycle tracking (state, createdAt, activatedAt, triggeredAt, expiresAt)
- Invalidation tracking (invalidatedAt, invalidationReason)

**setupSignals table** (apps/botbox/src/db/schema/setup-signals.ts)
- Signal tracking with revalidation fields
- Age tracking (firedAt, lastRecheckedAt)
- Timeframe context (detectedOnTimeframe)
- Validation state (stillValid, requiresRecheck)
- Missing: signalRole field to distinguish PRECONDITION vs TRIGGER signals

**marketRegimes table** (apps/botbox/src/db/schema/market-regimes.ts)
- Timeframe-specific regime tracking
- Proper metrics (trendStrength, priceVsMa, volatility)
- Lifecycle tracking (stillActive, startedAt, endedAt)

**priceLevels table** (apps/botbox/src/db/schema/price-levels.ts)
- Support/resistance tracking
- Strength calculation (tests, strength)
- Validation state (stillValid)

### Gaps

**setupSignals table improvements needed:**
```typescript
// Add signal role field
signalRole: text('signal_role').notNull() // 'PRECONDITION' | 'TRIGGER'
```

**Missing: candles table for efficient candle detection**
```typescript
export const candles = sqliteTable('candles', {
  id: integer('id').primaryKey(),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id, { onDelete: 'cascade' }),
  timeframe: text('timeframe').notNull(), // '1h', '4h', '1d'
  openTime: text('open_time').notNull(),
  closeTime: text('close_time').notNull(),
  open: real('open').notNull(),
  high: real('high').notNull(),
  low: real('low').notNull(),
  close: real('close').notNull(),
  volume: real('volume').notNull(),
  isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
  indicators: text('indicators', { mode: 'json' }), // RSI, MACD, etc.
})
```

**Missing: trades table for position tracking**
```typescript
export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey(),
  setupId: integer('setup_id')
    .notNull()
    .references(() => setups.id),
  instrumentId: integer('instrument_id')
    .notNull()
    .references(() => instruments.id),
  direction: text('direction').notNull(), // 'LONG' | 'SHORT'
  entryPrice: real('entry_price').notNull(),
  quantity: real('quantity').notNull(),
  stopLoss: real('stop_loss').notNull(),
  takeProfit1: real('take_profit_1'),
  takeProfit2: real('take_profit_2'),
  entryTime: text('entry_time').notNull().default(sql`CURRENT_TIMESTAMP`),
  exitTime: text('exit_time'),
  exitPrice: real('exit_price'),
  exitReason: text('exit_reason'), // 'STOP_LOSS' | 'TAKE_PROFIT' | 'TIMEOUT' | 'MANUAL'
  realizedPnl: real('realized_pnl'),
  realizedPnlPercent: real('realized_pnl_percent'),
  stopMovedToBreakeven: integer('stop_moved_to_breakeven', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('OPEN'), // 'OPEN' | 'CLOSED'
  triggerSignals: text('trigger_signals', { mode: 'json' }), // Signal IDs that triggered entry
})
```

## 2. Trading Logic Functions Analysis

### What Exists

**packages/trading/src/setup-lifecycle.ts**
- createResistanceRejectionSetup() - Proper entry/stop/TP calculation
- getTTLForSetup() - Matches trader's TTL table exactly for 1h and 4h
- evaluateSetupState() - Basic state transitions FORMING → ACTIVE → TRIGGERED
- shouldInvalidateSetup() - Price movement invalidation

**packages/trading/src/signal-detection.ts**
- getSignalAgeLimits() - Age limits match trader specs
- isSignalStillValid() - Age-based validation
- shouldRecheckSignal() - Recheck interval logic

**packages/trading/src/position-management.ts**
- shouldMoveStopToBreakeven() - 3% threshold
- shouldEnableTrailingStop() - 5% threshold
- calculateTrailingStopPrice() - 2% trailing distance
- shouldClosePositionDueToTimeout() - 24h for 1h, 72h for 4h

### Gaps

**Missing: Candle detection utilities**
```typescript
// packages/trading/src/candle-detection.ts
export function isNewCandleClosed(
  timeframe: Timeframe,
  currentTime: Date
): boolean

export function calculateCandlesElapsed(
  timeframe: Timeframe,
  startTime: Date,
  currentTime: Date
): number

export function getNextCandleCloseTime(
  timeframe: Timeframe,
  currentTime: Date
): Date
```

**Missing: Signal revalidation with market data**
```typescript
// packages/trading/src/signal-revalidation.ts
export function checkSignalStillValid(
  signal: SetupSignal,
  currentMarketData: MarketData
): boolean

export function revalidateRSISignal(
  signal: SetupSignal,
  currentRSI: number
): boolean

export function revalidateRejectionWick(
  signal: SetupSignal,
  recentCandles: Candle[]
): boolean

export function revalidateVolumeSignal(
  signal: SetupSignal,
  currentVolume: number,
  volumeMA: number
): boolean
```

**Missing: Multi-timeframe context validation**
```typescript
// packages/trading/src/context-validation.ts
export function checkContextRegimeValid(
  setup: Setup,
  currentContextRegime: MarketRegime
): { valid: boolean; reason?: string }

export function checkDailyTrendAlignment(
  symbol: string,
  setupDirection: 'LONG' | 'SHORT',
  dailyRegime: MarketRegime
): boolean

export function checkPriceLevelStrength(
  symbol: string,
  timeframe: Timeframe,
  levelType: 'RESISTANCE' | 'SUPPORT',
  price: number,
  minStrength: number
): PriceLevel | null
```

**Missing: Setup creation with full context checking**
```typescript
// Expand createResistanceRejectionSetup to include:
// 1. Daily regime check
// 2. 4h price level validation
// 3. Automatic regime linkage
// 4. Return null if context invalid
```

## 3. Main Trading Loop - CRITICAL MISSING PIECE

The trader's specification requires a main loop that:
1. Runs every 60 seconds (1h trading) or 5 minutes (4h trading)
2. Detects new candle closes
3. Updates indicators on candle close
4. Manages setup lifecycle
5. Revalidates signals
6. Checks for setup triggers
7. Manages open positions

**Currently:** No main loop exists

**Required Implementation:**

**Option A: Cloudflare Cron Trigger** (recommended for Cloudflare deployment)
```typescript
// apps/botbox/src/cron/trading-loop.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runTradingLoop(env))
  }
}

// wrangler.toml
[triggers]
crons = ["*/1 * * * *"] // Every minute
```

**Option B: Durable Object with Alarms** (more precise timing)
```typescript
// apps/botbox/src/durable-objects/trading-scheduler.ts
export class TradingScheduler implements DurableObject {
  async alarm() {
    await this.runTradingCycle()
    await this.storage.setAlarm(Date.now() + 60000) // 1 minute
  }
}
```

**Required Loop Structure:**
```typescript
// packages/trading/src/main-loop.ts
export async function runTradingLoop(db: Database, exchange: Exchange) {
  const currentTime = new Date()

  // PHASE 1: Candle completion detection
  if (isNewCandleClosed('1h', currentTime)) {
    await processNewCandle(db, exchange, '1h', currentTime)
  }
  if (isNewCandleClosed('4h', currentTime)) {
    await processNewCandle(db, exchange, '4h', currentTime)
  }
  if (isNewCandleClosed('1d', currentTime)) {
    await processNewCandle(db, exchange, '1d', currentTime)
  }

  // PHASE 2: Regime updates (on new candles)
  await updateRegimesIfNeeded(db)

  // PHASE 3: Safety checks
  if (await shouldPauseTrading(db)) {
    return
  }

  // PHASE 4: Setup lifecycle
  await expireOldSetups(db, currentTime)
  await checkSetupInvalidations(db)

  // PHASE 5: Signal revalidation
  await revalidateSignals(db, exchange)

  // PHASE 6: Evaluate active setups
  await evaluateActiveSetups(db, exchange)

  // PHASE 7: Scan for new setups
  if (await canCreateNewSetups(db)) {
    await scanForNewSetups(db, exchange)
  }

  // PHASE 8: Position management
  await manageOpenPositions(db, exchange)
}
```

## 4. Specific Function Implementations Needed

### processNewCandle()
```typescript
async function processNewCandle(
  db: Database,
  exchange: Exchange,
  timeframe: Timeframe,
  currentTime: Date
) {
  const symbols = await getActiveSymbols(db)

  for (const symbol of symbols) {
    // Fetch latest candle from exchange
    const candle = await exchange.fetchLatestCandle(symbol, timeframe)

    // Store in candles table
    await db.insert(candles).values({
      instrumentId: symbol.id,
      timeframe,
      ...candle,
      isClosed: true
    })

    // Calculate indicators
    const indicators = await calculateIndicators(db, symbol, timeframe)
    await db.update(candles)
      .set({ indicators })
      .where(eq(candles.id, candle.id))

    // Update price levels
    await updatePriceLevels(db, symbol, timeframe, candle)

    // Update market regime
    await updateMarketRegime(db, symbol, timeframe)

    // Check for new signals
    await checkAndFireSignals(db, symbol, timeframe, candle, indicators)

    // Increment candle count for active setups
    await incrementSetupCandleCounts(db, symbol, timeframe)
  }
}
```

### revalidateSignals()
```typescript
async function revalidateSignals(db: Database, exchange: Exchange) {
  const signalsToRecheck = await db
    .select()
    .from(setupSignals)
    .innerJoin(setups, eq(setupSignals.setupId, setups.id))
    .where(
      and(
        eq(setupSignals.stillValid, true),
        eq(setupSignals.requiresRecheck, true),
        inArray(setups.state, ['FORMING', 'ACTIVE'])
      )
    )

  for (const { setupSignals: signal, setups: setup } of signalsToRecheck) {
    // Fetch current market data
    const candle = await getLatestCandle(db, setup.instrumentId, signal.detectedOnTimeframe)
    const indicators = candle.indicators

    // Check if still valid based on signal type
    const isValid = await checkSignalStillValidWithData(signal, candle, indicators)

    if (!isValid) {
      await db.update(setupSignals)
        .set({
          stillValid: false,
          invalidatedAt: new Date().toISOString()
        })
        .where(eq(setupSignals.id, signal.id))
    }

    // Update last recheck time
    await db.update(setupSignals)
      .set({ lastRecheckedAt: new Date().toISOString() })
      .where(eq(setupSignals.id, signal.id))
  }
}
```

### evaluateActiveSetups()
```typescript
async function evaluateActiveSetups(db: Database, exchange: Exchange) {
  const activeSetups = await db
    .select()
    .from(setups)
    .where(inArray(setups.state, ['FORMING', 'ACTIVE']))

  for (const setup of activeSetups) {
    const currentPrice = await exchange.getCurrentPrice(setup.instrumentId)
    const currentTime = new Date()

    // Check if expired
    if (currentTime > new Date(setup.expiresAt)) {
      await invalidateSetup(db, setup.id, 'TIME_EXPIRED')
      continue
    }

    // Check price-based invalidation
    const invalidation = shouldInvalidateSetup(
      currentPrice,
      setup.entryZoneLow,
      setup.entryZoneHigh,
      setup.direction as 'LONG' | 'SHORT',
      getMinutesSince(setup.activatedAt)
    )

    if (invalidation.shouldInvalidate) {
      await invalidateSetup(db, setup.id, invalidation.reason!)
      continue
    }

    // Check context regime change
    if (setup.contextRegimeId) {
      const currentContextRegime = await getCurrentRegime(db, setup.instrumentId, setup.contextTimeframe!)
      if (currentContextRegime.id !== setup.contextRegimeId) {
        await invalidateSetup(db, setup.id, 'CONTEXT_REGIME_CHANGED')
        continue
      }
    }

    // State transitions
    const validSignals = await getValidSignalsForSetup(db, setup.id)
    const minutesSinceCreation = getMinutesSince(setup.createdAt)

    const newState = evaluateSetupState(
      setup.state as SetupState,
      currentPrice,
      setup.entryZoneLow,
      setup.entryZoneHigh,
      setup.requiredConfirmations,
      validSignals.length,
      minutesSinceCreation,
      setup.formingDurationMinutes
    )

    if (newState === 'ACTIVE' && setup.state === 'FORMING') {
      await db.update(setups)
        .set({
          state: 'ACTIVE',
          activatedAt: currentTime.toISOString()
        })
        .where(eq(setups.id, setup.id))
    }

    if (newState === 'TRIGGERED' && setup.state === 'ACTIVE') {
      await triggerTrade(db, exchange, setup, validSignals)
    }
  }
}
```

### triggerTrade()
```typescript
async function triggerTrade(
  db: Database,
  exchange: Exchange,
  setup: Setup,
  signals: SetupSignal[]
) {
  // Risk checks
  if (!await canOpenNewTrade(db)) {
    return
  }

  // Calculate position size
  const accountBalance = await exchange.getAccountBalance()
  const riskAmount = accountBalance * 0.01 // 1% risk
  const stopDistance = Math.abs(setup.entryZoneHigh - setup.stopLoss)
  const positionSize = riskAmount / stopDistance

  // Place entry order
  const entryPrice = await exchange.getCurrentPrice(setup.instrumentId)
  const order = await exchange.placeOrder({
    symbol: setup.instrumentId,
    side: setup.direction === 'SHORT' ? 'SELL' : 'BUY',
    quantity: positionSize,
    price: entryPrice,
    type: 'LIMIT'
  })

  if (order.status === 'FILLED') {
    // Update setup
    await db.update(setups)
      .set({
        state: 'TRIGGERED',
        triggeredAt: new Date().toISOString()
      })
      .where(eq(setups.id, setup.id))

    // Create trade record
    await db.insert(trades).values({
      setupId: setup.id,
      instrumentId: setup.instrumentId,
      direction: setup.direction,
      entryPrice: order.avgPrice,
      quantity: order.executedQty,
      stopLoss: setup.stopLoss,
      takeProfit1: setup.takeProfit1,
      takeProfit2: setup.takeProfit2,
      triggerSignals: JSON.stringify(signals.map(s => s.id)),
      status: 'OPEN'
    })

    // Place stop loss
    await exchange.placeStopLoss(setup.instrumentId, setup.stopLoss, positionSize)

    // Place take profit orders
    if (setup.takeProfit1) {
      await exchange.placeTakeProfit(setup.instrumentId, setup.takeProfit1, positionSize * 0.5)
    }
    if (setup.takeProfit2) {
      await exchange.placeTakeProfit(setup.instrumentId, setup.takeProfit2, positionSize * 0.3)
    }
  }
}
```

### manageOpenPositions()
```typescript
async function manageOpenPositions(db: Database, exchange: Exchange) {
  const openTrades = await db
    .select()
    .from(trades)
    .where(eq(trades.status, 'OPEN'))

  for (const trade of openTrades) {
    const currentPrice = await exchange.getCurrentPrice(trade.instrumentId)

    // Calculate P&L
    let pnlPercent: number
    if (trade.direction === 'SHORT') {
      pnlPercent = (trade.entryPrice - currentPrice) / trade.entryPrice
    } else {
      pnlPercent = (currentPrice - trade.entryPrice) / trade.entryPrice
    }

    // Move stop to breakeven at 3% profit
    if (!trade.stopMovedToBreakeven && shouldMoveStopToBreakeven(pnlPercent)) {
      await exchange.updateStopLoss(trade.instrumentId, trade.entryPrice)
      await db.update(trades)
        .set({ stopMovedToBreakeven: true, stopLoss: trade.entryPrice })
        .where(eq(trades.id, trade.id))
    }

    // Trailing stop at 5% profit
    if (shouldEnableTrailingStop(pnlPercent)) {
      const newStop = calculateTrailingStopPrice(
        currentPrice,
        trade.direction as 'LONG' | 'SHORT'
      )

      // Only update if new stop is better
      const isBetterStop = trade.direction === 'SHORT'
        ? newStop < trade.stopLoss
        : newStop > trade.stopLoss

      if (isBetterStop) {
        await exchange.updateStopLoss(trade.instrumentId, newStop)
        await db.update(trades)
          .set({ stopLoss: newStop })
          .where(eq(trades.id, trade.id))
      }
    }

    // Time-based exit
    const setup = await db.select().from(setups).where(eq(setups.id, trade.setupId)).get()
    const holdHours = getHoursSince(trade.entryTime)

    if (shouldClosePositionDueToTimeout(holdHours, setup.entryTimeframe as '1h' | '4h', pnlPercent)) {
      await exchange.closePosition(trade.instrumentId)
      await db.update(trades)
        .set({
          status: 'CLOSED',
          exitTime: new Date().toISOString(),
          exitPrice: currentPrice,
          exitReason: 'TIMEOUT',
          realizedPnl: (currentPrice - trade.entryPrice) * trade.quantity,
          realizedPnlPercent: pnlPercent
        })
        .where(eq(trades.id, trade.id))
    }
  }
}
```

## 5. Priority Implementation Order

### Phase 1: Foundation (Critical)
1. Add candles table to schema
2. Add trades table to schema
3. Add signalRole field to setupSignals
4. Implement candle-detection.ts utilities
5. Implement main-loop.ts structure

### Phase 2: Signal Management (High Priority)
6. Implement signal-revalidation.ts with market data checking
7. Implement checkAndFireSignals() in main loop
8. Add signal role tracking (PRECONDITION vs TRIGGER)

### Phase 3: Context Validation (High Priority)
9. Implement context-validation.ts functions
10. Enhance createResistanceRejectionSetup with context checks
11. Add automatic regime linkage

### Phase 4: Execution (Critical)
12. Implement evaluateActiveSetups() fully
13. Implement triggerTrade() with order placement
14. Implement manageOpenPositions() with stop/TP management

### Phase 5: Infrastructure (Medium Priority)
15. Set up Cloudflare Cron trigger or Durable Object scheduler
16. Implement processNewCandle() pipeline
17. Add updateMarketRegime() logic
18. Add updatePriceLevels() logic

### Phase 6: Safety & Monitoring (Medium Priority)
19. Implement shouldPauseTrading() with volatility checks
20. Implement canCreateNewSetups() with position limits
21. Add comprehensive logging
22. Add alerting for critical failures

## 6. Testing Requirements

### Unit Tests Needed
- candle-detection.test.ts - Test candle close detection for all timeframes
- signal-revalidation.test.ts - Test each signal type revalidation
- context-validation.test.ts - Test multi-timeframe context checks
- setup-lifecycle.test.ts - Expand with state transition edge cases

### Integration Tests Needed
- main-loop.test.ts - Mock full loop execution
- trade-execution.test.ts - Mock exchange orders and fills
- position-management.test.ts - Test stop/TP adjustments

### End-to-End Tests
- Use Bybit testnet for real order flow testing
- Test LINEA resistance rejection scenario end-to-end

## 7. Configuration Requirements

### Environment Variables Needed
```env
TRADING_ENABLED=true
TRADING_TIMEFRAME=1h  # or 4h
LOOP_INTERVAL_SECONDS=60
MAX_CONCURRENT_SETUPS=10
MAX_CONCURRENT_TRADES=5
RISK_PER_TRADE_PERCENT=0.01
PAUSE_ON_VOLATILITY_SPIKE_PERCENT=1.0
```

### Database Indexes Needed
```sql
CREATE INDEX idx_setups_active ON setups(instrument_id, state)
  WHERE state IN ('FORMING', 'ACTIVE');

CREATE INDEX idx_setups_expiry ON setups(expires_at)
  WHERE state IN ('FORMING', 'ACTIVE');

CREATE INDEX idx_signals_recheck ON setup_signals(setup_id, still_valid, requires_recheck);

CREATE INDEX idx_candles_latest ON candles(instrument_id, timeframe, close_time DESC);

CREATE INDEX idx_trades_open ON trades(status, instrument_id)
  WHERE status = 'OPEN';
```

## 8. Summary of Work Required

**Estimated Effort:**
- Database migrations: 2-4 hours
- Candle detection utilities: 3-5 hours
- Signal revalidation: 5-8 hours
- Context validation: 4-6 hours
- Main loop structure: 8-12 hours
- Trade execution: 8-12 hours
- Position management: 5-8 hours
- Testing: 10-15 hours
- Infrastructure setup: 3-5 hours

**Total: 48-75 hours**

**Critical Path:**
1. Database schema updates
2. Candle detection
3. Main loop skeleton
4. Signal revalidation
5. Setup evaluation
6. Trade execution
7. Testing with testnet

The existing codebase provides a strong foundation. The main gaps are:
1. No main trading loop (most critical)
2. No candle close detection
3. No active signal revalidation with market data
4. No trade execution logic
5. Missing database tables (candles, trades)

Once these gaps are filled, the system will match the trader's 1h-4h specifications.
