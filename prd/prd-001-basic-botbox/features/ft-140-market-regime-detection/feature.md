# Feature: ft-140 - Market Regime Detection

**Status:** Planned
**Priority:** P1
**Phase:** 2

## Problem Statement

Trading strategies perform differently in trending vs. ranging vs. volatile markets. Running a mean-reversion strategy during a parabolic trend bleeds capital. Without regime awareness, bots trade blindly in unfavorable conditions.

## Goals

- Classify current market regime per asset (trending, ranging, high/low volatility)
- Auto-pause strategies when market regime is unfavorable
- Track strategy performance per regime
- Alert on regime changes

## Success Metrics

- Regime classification accuracy >80% (validated against manual review)
- Regime change detection within 1 hour
- Prevent >50% of losing trades by pausing during unfavorable regimes
- Per-regime performance tracking enables data-driven strategy selection

## User Stories

### US-001: View Current Market Regime
**As a trader**, I want to see the current market regime for each asset, so I know if conditions favor my strategies.

**Acceptance Criteria:**
- Dashboard shows per-asset regime: "BTC/USDT: Trending Up (High Volatility)"
- Regime indicators: Trending Up/Down, Ranging, High Volatility, Low Volatility
- Regime strength score: "Trending confidence: 85%"
- Last regime change timestamp: "Entered trending 3 hours ago"

### US-002: Auto-Pause on Unfavorable Regime
**As a trader**, I want bots to auto-pause when market regime is unfavorable, so they don't trade in losing conditions.

**Acceptance Criteria:**
- Strategy tagged with optimal regimes: "RSI Mean Reversion: optimal=[Ranging], poor=[Trending]"
- When BTC regime changes from Ranging → Trending, auto-pause RSI bot
- Alert: "Bot-RSI paused: BTC entered Trending regime (unfavorable)"
- Bot remains paused until regime returns to Ranging or manual override
- Option to disable auto-pause per bot

### US-003: Regime Change Alerts
**As a trader**, I want notifications when market regime shifts, so I can review active strategies.

**Acceptance Criteria:**
- Alert when regime changes: "BTC regime changed: Ranging → Trending Up"
- Include affected bots: "3 bots may be impacted, review recommended"
- Alert on volatility spikes: "BTC volatility increased 200% in 4 hours"
- Configurable: only alert on major regime changes, ignore minor fluctuations

### US-004: Per-Regime Performance Tracking
**As a trader**, I want to see strategy performance broken down by regime, so I know which conditions favor each strategy.

**Acceptance Criteria:**
- Strategy analytics page shows regime-specific metrics:
  - "Trending: +8.5% (15 trades), Win rate 73%"
  - "Ranging: +12.3% (42 trades), Win rate 64%"
  - "High Volatility: -3.2% (8 trades), Win rate 38%"
- Sharpe ratio per regime
- Recommendation: "This strategy excels in Ranging markets, avoid in Trending"

## Technical Requirements

### Regime Classification Algorithm

**Per Asset, Calculated Every 5 Minutes:**

**1. Trend Detection (ADX-based):**
- ADX >25: Trending
- ADX <20: Ranging
- ADX 20-25: Transitional

**2. Trend Direction (DMI-based):**
- +DI > -DI: Trending Up
- -DI > +DI: Trending Down

**3. Volatility Level (ATR-based):**
- Current ATR > 1.5x 30-day avg ATR: High Volatility
- Current ATR < 0.7x 30-day avg ATR: Low Volatility
- Otherwise: Normal Volatility

**4. Combined Regime:**
```
if ADX >25 and +DI > -DI: "Trending Up"
if ADX >25 and -DI > +DI: "Trending Down"
if ADX <20: "Ranging"

if ATR >1.5x avg: append " (High Volatility)"
if ATR <0.7x avg: append " (Low Volatility)"
```

**Examples:**
- "Trending Up"
- "Trending Up (High Volatility)"
- "Ranging (Low Volatility)"
- "Trending Down"

### Strategy-Regime Mapping

Add to strategy configuration:
```typescript
interface StrategyRegimeConfig {
  optimalRegimes: Regime[]  // Performs best
  acceptableRegimes: Regime[]  // Can trade
  poorRegimes: Regime[]  // Should avoid
  autoPauseOnPoor: boolean  // Auto-pause in poor regimes
}

type Regime =
  | "Trending Up"
  | "Trending Down"
  | "Ranging"
  | "High Volatility"
  | "Low Volatility"
```

**Example:**
```javascript
// RSI Mean Reversion Strategy
{
  optimalRegimes: ["Ranging", "Low Volatility"],
  acceptableRegimes: ["Ranging"],
  poorRegimes: ["Trending Up", "Trending Down", "High Volatility"],
  autoPauseOnPoor: true
}
```

### Auto-Pause Logic

**Every 5 Minutes:**
```
for each asset with active bots:
  currentRegime = detectRegime(asset)

  if currentRegime != previousRegime:
    for each bot trading this asset:
      if currentRegime in bot.strategy.poorRegimes:
        if bot.autoPauseOnPoor:
          pauseBot(bot)
          alert("Bot paused: unfavorable regime")

      if currentRegime in bot.strategy.optimalRegimes:
        if bot.pausedDueToRegime and bot.autoResumeOnOptimal:
          resumeBot(bot)
          alert("Bot resumed: favorable regime")
```

## Data Model

```typescript
interface AssetRegime {
  asset: string  // "BTC/USDT"
  regime: string  // "Trending Up (High Volatility)"
  trend: "Trending Up" | "Trending Down" | "Ranging"
  volatility: "High" | "Normal" | "Low"
  confidence: number  // 0-1
  indicators: {
    adx: number
    plusDI: number
    minusDI: number
    atr: number
    atrAvg30d: number
  }
  detectedAt: Date
  previousRegime?: string
  regimeChangedAt?: Date
}

interface RegimeChangeEvent {
  asset: string
  fromRegime: string
  toRegime: string
  timestamp: Date
  affectedBots: string[]
  actionsTaken: string[]  // ["Paused Bot-RSI", "Alerted user"]
}
```

## Dashboard Requirements

**Market Regime Panel:**
- Card per actively traded asset
- Shows: Asset name, current regime badge, regime strength indicator
- Mini timeline: regime history (last 24h)
- Click to expand: detailed indicators (ADX, ATR values)

**Strategy-Regime Fit Indicator:**
- On bot status card, show regime compatibility:
  - Green: "Optimal regime for this strategy"
  - Yellow: "Acceptable regime"
  - Red: "Unfavorable regime (bot paused)"

## Testing Strategy

**Critical Tests:**
1. Simulate trending market (ADX >25) → verify regime = "Trending"
2. Trigger regime change → verify bots with autoPause enabled pause within 5 min
3. Mean-reversion bot in trending market → verify auto-paused
4. Regime returns to ranging → verify bot auto-resumes (if enabled)
5. Volatility spike (ATR 2x avg) → verify regime includes "High Volatility" flag

## Performance Tracking

**Regime Performance Report** (per strategy):
```
Strategy: RSI Mean Reversion v1.2

Trending Up:     -2.3% (12 trades, 33% win rate)  ❌ Avoid
Trending Down:   -1.8% (8 trades, 38% win rate)   ❌ Avoid
Ranging:        +15.2% (45 trades, 67% win rate)  ✅ Optimal
High Volatility: -5.1% (6 trades, 17% win rate)   ❌ Avoid
Low Volatility: +8.7% (23 trades, 70% win rate)   ✅ Optimal

Recommendation: Only trade in Ranging or Low Volatility regimes
```

## Dependencies

- FT-115: Historical Data Management (provides price history for indicators)
- FT-100: Bot Management (pause/resume bot lifecycle)
- FT-130: Monitoring & Alerts (send regime change alerts)
- FT-135: Live Performance Analytics (track per-regime P&L)

## Open Questions

- Should regime detection use 1h candles or 4h candles?
  - **Recommendation**: 1h for swing trading (balances responsiveness and noise)
- How to handle regime transitions (e.g., ADX = 22, unclear if trending or ranging)?
  - **Recommendation**: Use confidence score, only act on high-confidence regime changes (>75%)
- Should auto-resume be enabled by default?
  - **Recommendation**: No, require manual resume for safety (auto-pause yes, auto-resume opt-in)
