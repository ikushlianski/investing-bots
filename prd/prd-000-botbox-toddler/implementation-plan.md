# Implementation Plan: Core Trading System Components

**Status:** Planning  
**Created:** 2025-01-27  
**Priority:** P0 (Critical for trading system functionality)

## Overview

This document outlines the implementation plan for the remaining core components needed to make the trading system fully operational. The plan covers 9 high and medium priority items identified in the implementation summary.

## High Priority Items

### 1. [ ] Exchange Integration (Bybit API)

**Location:** `packages/core/src/exchanges/`  
**Files to Modify/Create:**

- Create `packages/core/src/exchanges/exchange-service.ts` - Wrapper implementing Exchange interface
- Update `packages/core/src/trading/main-loop.ts` - Use ExchangeService instead of stub

**Implementation Details:**

- Implement `Exchange` interface from `main-loop.ts` using existing `BybitAdapter`
- Methods to implement:
  - `getCurrentPrice(instrumentId)` - Use Bybit ticker API
  - `fetchLatestCandle(instrumentId, timeframe)` - Use Bybit kline API
  - `getAccountBalance()` - Use existing getBalance from BybitAdapter
  - `placeOrder(order)` - Use existing placeOrder from BybitAdapter
  - `placeStopLoss()` / `placeTakeProfit()` / `updateStopLoss()` / `closePosition()` - Map to Bybit conditional orders

**Dependencies:**

- Existing `BybitAdapter` in `packages/core/src/exchanges/adapters/bybit-adapter.ts`
- `CredentialsProvider` for API key management
- Instrument symbol mapping (instrumentId → symbol)

### 2. [ ] Indicator Calculation

**Location:** `packages/core/src/trading/`  
**Files to Create:**

- `packages/core/src/trading/indicators.ts` - Indicator calculation functions
- `packages/core/src/trading/indicators.test.ts` - Unit tests

**Implementation Details:**

- `calculateRSI(candles, period=14)` - Relative Strength Index
- `calculateMACD(candles, fast=12, slow=26, signal=9)` - MACD with signal line and histogram
- `calculateEMA(candles, period)` - Exponential Moving Average (20, 50 periods)
- `calculateVolumeMA(candles, period=20)` - Volume Moving Average
- `calculateIndicators(instrumentId, timeframe, candles)` - Main function that:
  - Fetches recent candles from database
  - Calculates all indicators
  - Stores in `candles.indicators` JSON field
  - Called from `updateIndicators()` in `main-loop.ts`

**Dependencies:**

- Database schema: `candles` table with `indicators` JSON field
- Historical candle data for calculation

### 3. [ ] Setup Scanning Logic

**Location:** `packages/core/src/trading/`  
**Files to Modify:**

- `packages/core/src/trading/main-loop.ts` - Implement `scanForNewSetups()`
- `packages/core/src/trading/setup-lifecycle.ts` - May need helper functions

**Implementation Details:**

- Implement `scanForNewSetups(db, exchange)` function:
  - Fetch active instruments from database
  - For each instrument:
    - Check daily/4h context (regime, price levels)
    - Detect resistance rejection patterns (rejection wicks near resistance)
    - Detect support breakdown patterns
    - Create setups using `createResistanceRejectionSetup()` from `setup-lifecycle.ts`
    - Store in `setups` table with state='FORMING'
  - Use trader's LINEA example as template:
    - Daily regime check (TRENDING_DOWN for SHORT setups)
    - 4h resistance detection (price level with 3+ tests)
    - Create setup with proper entry zone, stop loss, take profits

**Dependencies:**

- `updatePriceLevels()` for resistance/support detection
- `updateMarketRegime()` for daily context
- Database `setups` table
- `createResistanceRejectionSetup()` from `setup-lifecycle.ts`

### 4. [ ] Trade Execution Completion

**Location:** `packages/core/src/trading/`  
**Files to Modify:**

- `packages/core/src/trading/main-loop.ts` - Implement `triggerTrade()`

**Implementation Details:**

- Complete `triggerTrade()` function:
  - Calculate position size based on:
    - Account balance
    - Risk per trade (config.riskPerTradePercent)
    - Stop loss distance
  - Place market order via exchange
  - Place stop loss order
  - Place take profit orders (TP1: 50%, TP2: 30%)
  - Create trade record in `trades` table
  - Update setup state to 'TRIGGERED'
  - Link trade to setup

**Dependencies:**

- Exchange service (item #1)
- Database `trades` table
- Position sizing calculation logic

### 5. [ ] Position Management Completion

**Location:** `packages/core/src/trading/`  
**Files to Modify:**

- `packages/core/src/trading/main-loop.ts` - Implement `manageOpenPositions()`
- `packages/core/src/trading/position-management.ts` - Already has helper functions

**Implementation Details:**

- Complete `manageOpenPositions()` function:
  - Fetch open positions from `trades` table
  - For each position:
    - Get current price
    - Calculate P&L percentage
    - Check if should move stop to breakeven (using `shouldMoveStopToBreakeven()`)
    - Check if should enable trailing stop (using `shouldEnableTrailingStop()`)
    - Calculate trailing stop price (using `calculateTrailingStopPrice()`)
    - Check if should close due to timeout (using `shouldClosePositionDueToTimeout()`)
    - Update stop loss orders via exchange
    - Update trade record
    - Close position if TP hit or stop loss hit

**Dependencies:**

- Exchange service for order updates
- `position-management.ts` helper functions (already implemented)
- Database `trades` table

## Medium Priority Items

### 6. [ ] Price Level Detection

**Location:** `packages/core/src/trading/`  
**Files to Create/Modify:**

- `packages/core/src/trading/price-levels.ts` - Price level detection logic
- `packages/core/src/trading/main-loop.ts` - Implement `updatePriceLevels()`

**Implementation Details:**

- Implement `updatePriceLevels()` function:
  - Fetch recent candles (last 100-200 candles)
  - Detect swing highs (resistance) and swing lows (support)
  - Count number of tests at each level
  - Calculate level strength (based on tests, time, volume)
  - Store in `price_levels` table
  - Invalidate broken levels (price moved through level)
  - Link levels to setups for context

**Dependencies:**

- Database `price_levels` table
- Historical candle data

### 7. [ ] Market Regime Calculation

**Location:** `packages/core/src/trading/`  
**Files to Create/Modify:**

- `packages/core/src/trading/market-regimes.ts` - Regime calculation logic
- `packages/core/src/trading/main-loop.ts` - Implement `updateMarketRegime()`

**Implementation Details:**

- Implement `updateMarketRegime()` function:
  - Calculate EMA(20) and EMA(50) on timeframe
  - Determine trend direction (price vs EMAs)
  - Calculate trend strength (0-100) based on:
    - Price distance from EMAs
    - EMA slope
    - RSI momentum
  - Determine regime type:
    - TRENDING_UP: Price > EMA20 > EMA50, strong momentum
    - TRENDING_DOWN: Price < EMA20 < EMA50, strong momentum
    - RANGING: Price oscillating between support/resistance
    - VOLATILE: High ATR, large candles
    - NEUTRAL: Weak trend signals
  - Store in `market_regimes` table
  - Mark previous regimes as inactive

**Dependencies:**

- Indicator calculation (EMA, RSI)
- Database `market_regimes` table

### 8. [ ] Signal Firing Logic

**Location:** `packages/core/src/trading/`  
**Files to Create/Modify:**

- `packages/core/src/trading/signal-detection.ts` - May need signal detection helpers
- `packages/core/src/trading/main-loop.ts` - Implement `checkAndFireSignals()`

**Implementation Details:**

- Implement `checkAndFireSignals()` function:
  - Get latest candle and indicators
  - Check for signal conditions:
    - RSI_OVERBOUGHT: RSI > 70
    - RSI_OVERSOLD: RSI < 30
    - VOLUME_SPIKE: Volume > 2x volume MA
    - VOLUME_DECLINE: Volume < 0.5x volume MA
    - REJECTION_WICK: Long wick rejection (upper for resistance, lower for support)
    - MACD_DIVERGENCE: Price vs MACD divergence
    - PRICE_IN_ENTRY_ZONE: Price within setup entry zone
  - Determine signal role (PRECONDITION vs TRIGGER) based on setup state
  - Store in `setup_signals` table with:
    - `signalRole`: PRECONDITION for FORMING setups, TRIGGER for ACTIVE setups
    - `still_valid`: true
    - `requires_recheck`: true for time-sensitive signals

**Dependencies:**

- Indicator calculation (item #2)
- Database `setup_signals` table
- Active setups to link signals to

### 9. [ ] Scheduler Infrastructure (Cloudflare Cron)

**Location:** `apps/botbox/src/`  
**Files to Create:**

- `apps/botbox/src/cron/trading-loop.ts` - Cron trigger handler
- `apps/botbox/wrangler.toml` - Add cron trigger configuration

**Implementation Details:**

- Create Cloudflare Cron trigger:
  - Handler exports `scheduled` function
  - Calls `runTradingLoop()` from `packages/core/src/trading/main-loop.ts`
  - Runs every 60 seconds for 1h trading
  - Logs execution time and errors
  - Handles timeouts gracefully
- Configure in `wrangler.toml`:
  ```toml
  [triggers]
  crons = ["*/1 * * * *"]  # Every minute
  ```
- Add error handling and logging
- Consider using Durable Objects for more precise timing if needed

**Dependencies:**

- Database connection (getDb)
- Exchange service initialization
- Trading loop implementation

## Implementation Order

### Phase 1: Foundation (Week 1)

- [ ] Exchange Integration (#1) - Required for all other features
- [ ] Indicator Calculation (#2) - Required for signals and regimes
- [ ] Scheduler Infrastructure (#9) - Required to run the system

### Phase 2: Core Trading Logic (Week 2)

- [ ] Signal Firing Logic (#8) - Required for setup activation
- [ ] Setup Scanning Logic (#3) - Creates trading opportunities
- [ ] Trade Execution (#4) - Executes trades

### Phase 3: Position Management (Week 3)

- [ ] Position Management (#5) - Manages open trades

### Phase 4: Context & Analysis (Week 4)

- [ ] Price Level Detection (#6) - Improves setup quality
- [ ] Market Regime Calculation (#7) - Provides context

## Testing Strategy

### Unit Tests

- [ ] Indicator calculations (RSI, MACD, EMA)
- [ ] Signal detection logic
- [ ] Price level detection
- [ ] Market regime calculation

### Integration Tests

- [ ] Exchange service with Bybit testnet
- [ ] Full trading loop with mocked data
- [ ] Position management with simulated prices

### End-to-End Tests

- [ ] Bybit testnet deployment
- [ ] Historical data replay
- [ ] Full trade lifecycle (setup → trade → exit)

## Dependencies Summary

**External:**

- Bybit API (testnet and production)
- Cloudflare Workers (Cron triggers)
- Cloudflare D1 (Database)

**Internal:**

- `packages/core/src/exchanges/` - Exchange adapters
- `packages/core/src/trading/` - Trading logic
- `apps/botbox/src/db/` - Database schemas
- `packages/utils/` - Utility functions

## Configuration

### Environment Variables

```env
BYBIT_API_KEY=...
BYBIT_API_SECRET=...
TRADING_ENABLED=true
TRADING_TIMEFRAME=1h
LOOP_INTERVAL_SECONDS=60
MAX_CONCURRENT_SETUPS=10
MAX_CONCURRENT_TRADES=5
RISK_PER_TRADE_PERCENT=0.01
```

### Database Indexes

- [ ] `idx_candles_latest` on `candles(instrument_id, timeframe, close_time DESC)`
- [ ] `idx_setups_active` on `setups(instrument_id, state)`
- [ ] `idx_signals_recheck` on `setup_signals(setup_id, still_valid, requires_recheck)`
- [ ] `idx_trades_open` on `trades(status, instrument_id)`

## Success Criteria

- [ ] System can fetch candles and calculate indicators automatically
- [ ] System can detect setups based on price action and context
- [ ] System can execute trades with proper risk management
- [ ] System can manage positions (breakeven, trailing stops, exits)
- [ ] System runs continuously via Cloudflare Cron
- [ ] System handles errors gracefully and logs all actions

## Risks & Mitigation

**Risk:** Exchange API rate limits  
**Mitigation:** Use existing rate limiter, cache market data

**Risk:** Indicator calculation performance  
**Mitigation:** Calculate only on candle close, cache results

**Risk:** Database query performance  
**Mitigation:** Add proper indexes, batch operations where possible

**Risk:** Cloudflare Cron reliability  
**Mitigation:** Add retry logic, monitor execution times, use Durable Objects if needed
