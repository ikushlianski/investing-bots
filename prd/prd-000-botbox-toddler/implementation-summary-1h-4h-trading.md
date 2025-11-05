---
updated: 2025-11-06
status: implementation-in-progress
---

# Implementation Summary: 1h-4h Trading System

## Overview

This document summarizes the improvements made to align the codebase with the 1h-4h algorithmic trading system requirements provided by the trader.

## What Was Implemented

### 1. Database Schema Updates

**New Tables Added:**

#### Candles Table
Location: `apps/botbox/src/db/schema/candles.ts`

Stores OHLCV candle data with calculated indicators for efficient retrieval:
- Supports all timeframes (1h, 4h, 1d)
- Includes indicators field for RSI, MACD, EMAs
- Tracks candle completion status
- Enables historical analysis without recalculation

#### Trades Table
Location: `apps/botbox/src/db/schema/trades.ts`

Tracks executed trades from setup triggers:
- Links to setup that triggered the trade
- Stores entry/exit details
- Tracks stop loss and take profit levels
- Records P&L and exit reasons
- Supports position management features (breakeven, trailing stops)

**Schema Enhancements:**

#### Setup Signals Table
Location: `apps/botbox/src/db/schema/setup-signals.ts`

Added `signalRole` field to distinguish:
- PRECONDITION signals (needed for setup activation)
- TRIGGER signals (needed for trade execution)

This enables proper confluence checking with different signal requirements for each phase.

### 2. Trading Utility Functions

#### Candle Detection
Location: `packages/trading/src/candle-detection.ts`

Functions for time-based trading logic:
- `isNewCandleClosed()` - Detects when new candles complete (critical for timing)
- `calculateCandlesElapsed()` - Tracks setup age in candles
- `getNextCandleCloseTime()` - Schedules next check
- `getCandleOpenTime()` - Identifies current candle boundaries
- `getMinutesSince()` / `getHoursSince()` - Time calculations
- `getTimeframeMinutes()` - Timeframe conversions

All functions tested with 24 passing tests covering edge cases.

#### Signal Revalidation
Location: `packages/trading/src/signal-revalidation.ts`

Market-data-driven signal validation:
- `checkSignalStillValid()` - Main revalidation dispatcher
- `revalidateRSIOverbought()` / `revalidateRSIOversold()` - RSI checks
- `revalidateVolumeSpike()` / `revalidateVolumeDecline()` - Volume analysis
- `revalidateRejectionWick()` - Candlestick pattern verification
- `revalidateMACDDivergence()` - Divergence persistence check
- `revalidateTrendAlignment()` - EMA trend confirmation

Each function checks current market conditions to ensure signals haven't invalidated.

#### Context Validation
Location: `packages/trading/src/context-validation.ts`

Multi-timeframe alignment checks:
- `checkDailyTrendAlignment()` - Prevents counter-trend trades
- `checkPriceLevelStrength()` - Validates support/resistance quality
- `checkContextRegimeStillValid()` - Detects regime changes
- `checkVolatilityNormal()` - Safety check for volatility spikes

Enforces the trader's requirement: "Don't short in daily uptrend, don't long in daily downtrend."

### 3. Main Trading Loop
Location: `packages/trading/src/main-loop.ts`

Complete orchestration matching the trader's 8-phase structure:

**Phase 1: Candle Completion Detection**
- Checks 1h, 4h, 1d candles independently
- Triggers `processNewCandle()` only when candles close
- Prevents processing on every tick

**Phase 2: Regime Updates**
- Updates market regimes when new candles arrive
- Calculates trend strength, price vs MA, volatility
- Marks old regimes as inactive

**Phase 3: Safety Checks**
- `shouldPauseTrading()` checks volatility spikes
- Configurable pause threshold (default 2x normal volatility)
- Prevents new trades during abnormal market conditions

**Phase 4: Setup Lifecycle**
- `expireOldSetups()` - Time-based TTL enforcement
- `checkSetupInvalidations()` - Price and context checks
- Automatic cleanup of invalid setups

**Phase 5: Signal Revalidation**
- `revalidateSignals()` - Checks all active signals
- Invalidates stale or contradicted signals
- Updates last-recheck timestamps

**Phase 6: Evaluate Active Setups**
- `evaluateActiveSetups()` - State machine for FORMING → ACTIVE → TRIGGERED
- Checks price in entry zone + signal confluence
- Triggers trades when conditions met

**Phase 7: Scan for New Setups**
- `scanForNewSetups()` - Detects new opportunities (stub for implementation)
- Respects max concurrent setup limits
- Only runs when capacity available

**Phase 8: Position Management**
- `manageOpenPositions()` - Manages active trades (stub for implementation)
- Will handle stop-to-breakeven, trailing stops, time exits

### 4. Type System Enhancements
Location: `packages/trading/src/types.ts`

New types added:
- `SignalRole` - PRECONDITION | TRIGGER
- `Candle` - OHLCV structure
- `Indicators` - RSI, MACD, EMAs, volume MA
- `MarketData` - Complete market snapshot for signal checking

## What Matches Trader Requirements

### TTL Configuration
The existing `getTTLForSetup()` function exactly matches the trader's TTL table:

| Setup Type | 1h Formation | 1h Active | 4h Formation | 4h Active |
|------------|-------------|-----------|--------------|-----------|
| Resistance Rejection | 3h | 7h | 10h | 30h |
| Support Breakdown | 1.5h | 5h | 5h | 20h |
| Retest Short | 45min | 3h | 2.5h | 15h |
| Trend Continuation | 5h | 15h | 20h | 60h |
| Mean Reversion | 2.5h | 10h | 10h | 40h |

### Position Management
The existing `position-management.ts` matches trader specs:
- Breakeven at 3% profit
- Trailing stop at 5% profit
- 2% trailing distance
- Time-based exits: 24h for 1h trades, 72h for 4h trades

### Signal Age Limits
The existing `getSignalAgeLimits()` matches trader's signal validity table:
- RSI: 2h max (1h), 8h max (4h)
- Volume Spike: 1h max (1h), 4h max (4h)
- MACD Divergence: 4h max (1h), 16h max (4h)
- etc.

## What Still Needs Implementation

### High Priority

1. **Exchange Integration**
   - Implement `Exchange` interface with real Bybit API calls
   - Add `fetchLatestCandle()` for OHLCV data
   - Add `getCurrentPrice()` for real-time prices
   - Implement order placement and management

2. **Indicator Calculation**
   - `calculateIndicators()` function for RSI, MACD, EMAs
   - Volume MA calculations
   - Store in candles.indicators JSON field

3. **Setup Scanning**
   - Implement `scanForNewSetups()` with setup detection logic
   - Use trader's resistance rejection example as template
   - Check daily/4h context before creating setups

4. **Trade Execution**
   - Complete `triggerTrade()` implementation
   - Position sizing calculation
   - Order placement with stop loss and take profit

5. **Position Management**
   - Complete `manageOpenPositions()` implementation
   - Stop-to-breakeven logic
   - Trailing stop updates
   - Time-based exits

### Medium Priority

6. **Price Level Detection**
   - Implement `updatePriceLevels()` to detect support/resistance
   - Calculate level strength based on tests
   - Invalidate broken levels

7. **Market Regime Calculation**
   - Implement `updateMarketRegime()` with trend analysis
   - Calculate trend strength (0-100)
   - Determine regime type (TRENDING_UP, TRENDING_DOWN, RANGING, etc.)

8. **Signal Firing**
   - Implement `checkAndFireSignals()` to detect new signals
   - Check RSI levels, volume spikes, rejection wicks
   - Store with proper signalRole (PRECONDITION vs TRIGGER)

9. **Scheduler Infrastructure**
   - Cloudflare Cron trigger (recommended) or Durable Object with alarms
   - Run trading loop every 60 seconds for 1h trading
   - Log execution times and errors

### Low Priority

10. **Monitoring and Alerting**
    - Log all state transitions
    - Alert on critical failures
    - Dashboard for active setups and trades

11. **Backtesting Framework**
    - Historical candle replay
    - Setup detection validation
    - Performance metrics

## Configuration Required

### Environment Variables

```env
TRADING_ENABLED=true
TRADING_TIMEFRAME=1h
LOOP_INTERVAL_SECONDS=60
MAX_CONCURRENT_SETUPS=10
MAX_CONCURRENT_TRADES=5
RISK_PER_TRADE_PERCENT=0.01
PAUSE_ON_VOLATILITY_SPIKE=true
VOLATILITY_SPIKE_MULTIPLIER=2.0
```

### Database Indexes

```sql
CREATE INDEX idx_setups_active ON setups(instrument_id, state)
  WHERE state IN ('FORMING', 'ACTIVE');

CREATE INDEX idx_setups_expiry ON setups(expires_at)
  WHERE state IN ('FORMING', 'ACTIVE');

CREATE INDEX idx_signals_recheck ON setup_signals(setup_id, still_valid, requires_recheck)
  WHERE still_valid = 1 AND requires_recheck = 1;

CREATE INDEX idx_candles_latest ON candles(instrument_id, timeframe, close_time DESC);

CREATE INDEX idx_trades_open ON trades(status, instrument_id)
  WHERE status = 'OPEN';
```

## Example: LINEA Resistance Rejection Setup

Here's how the system would handle the trader's LINEA example:

### Step 1: Daily Context Check (processNewCandle for 1d)
```typescript
// Daily regime shows TRENDING_DOWN
// ✓ Safe to create SHORT setups
```

### Step 2: 4h Resistance Detection (updatePriceLevels for 4h)
```typescript
// Detects resistance at 0.01350 with 3 tests
// ✓ Strong level (strength >= 2)
```

### Step 3: Setup Creation (scanForNewSetups)
```typescript
const setup = createResistanceRejectionSetup('LINEA', 0.01350, '1h', '4h')
// Entry zone: 0.01340 - 0.01355
// Stop loss: 0.01400
// TP1: 0.01250, TP2: 0.01150
// TTL: 10 hours (3h forming + 7h active)
// State: FORMING
```

### Step 4: Price Enters Zone (evaluateActiveSetups)
```typescript
// 21:00 - Price hits 0.01345
// Signal: PRICE_IN_ENTRY_ZONE fires (PRECONDITION)
// Setup transitions: FORMING → ACTIVE
```

### Step 5: Signals Fire (checkAndFireSignals)
```typescript
// 22:00 - RSI reaches 76.5
// Signal: RSI_OVERBOUGHT fires (TRIGGER, 1 of 3)

// 23:00 - Rejection wick forms + volume declining
// Signal: REJECTION_WICK fires (TRIGGER, 2 of 3)
// Signal: VOLUME_DECLINE fires (TRIGGER, 3 of 3)
// ✓ 3 trigger signals → TRIGGER TRADE
```

### Step 6: Trade Execution (triggerTrade)
```typescript
// Entry: 0.01342
// Quantity: Calculated from 1% risk / stop distance
// Place market SELL order
// Place stop loss at 0.01400
// Place TP1 at 0.01250 (50% position)
// Place TP2 at 0.01150 (30% position)
```

### Step 7: Position Management (manageOpenPositions)
```typescript
// Price drops to 0.01300 → +3.1% profit
// Move stop to breakeven (0.01342)

// Price drops to 0.01250 → TP1 hit, 50% closed

// Price drops to 0.01150 → TP2 hit, 80% closed
// Remaining 20% runs with trailing stop
```

## Testing Strategy

### Unit Tests
- ✅ `candle-detection.test.ts` - 24 tests passing
- TODO: `signal-revalidation.test.ts`
- TODO: `context-validation.test.ts`
- TODO: `setup-lifecycle.test.ts` (expand existing)

### Integration Tests
- TODO: `main-loop.test.ts` - Mock full loop execution
- TODO: `trade-execution.test.ts` - Mock exchange orders

### End-to-End Tests
- TODO: Bybit testnet LINEA scenario
- TODO: Historical replay of successful trades

## Next Steps

### Immediate (This Week)
1. Implement indicator calculation functions
2. Add Bybit exchange adapter
3. Implement basic setup scanning for resistance rejection
4. Test end-to-end with Bybit testnet

### Short-term (Next 2 Weeks)
5. Complete trade execution logic
6. Implement position management
7. Add price level and regime calculation
8. Deploy with Cloudflare Cron

### Medium-term (Next Month)
9. Add remaining setup types (support breakdown, retest short, etc.)
10. Build monitoring dashboard
11. Implement backtesting framework
12. Optimize performance

## Key Files Reference

### Database Schema
- `apps/botbox/src/db/schema/candles.ts` - OHLCV storage
- `apps/botbox/src/db/schema/trades.ts` - Position tracking
- `apps/botbox/src/db/schema/setups.ts` - Setup lifecycle
- `apps/botbox/src/db/schema/setup-signals.ts` - Signal tracking
- `apps/botbox/src/db/schema/market-regimes.ts` - Regime tracking
- `apps/botbox/src/db/schema/price-levels.ts` - Support/resistance

### Trading Logic
- `packages/trading/src/main-loop.ts` - Orchestration
- `packages/trading/src/candle-detection.ts` - Time utilities
- `packages/trading/src/signal-revalidation.ts` - Signal checking
- `packages/trading/src/context-validation.ts` - Multi-timeframe checks
- `packages/trading/src/setup-lifecycle.ts` - State transitions
- `packages/trading/src/position-management.ts` - Trade management

### Documentation
- `prd/prd-001-basic-botbox/gap-analysis-1h-4h-trading.md` - Gap analysis
- `prd/prd-001-basic-botbox/implementation-summary-1h-4h-trading.md` - This file

## Summary

The codebase now has:
- ✅ Proper database schema for candles, trades, and enhanced signals
- ✅ Complete candle detection and time utilities
- ✅ Signal revalidation with market data
- ✅ Multi-timeframe context validation
- ✅ Main trading loop structure matching trader specs
- ✅ All existing TTL, position management, and signal age logic aligned

The remaining work is primarily:
- Exchange integration
- Indicator calculation
- Setup detection implementation
- Trade execution completion
- Infrastructure deployment

The foundation is solid and matches the trader's 1h-4h specifications. The system is ready for the next phase of implementation.
