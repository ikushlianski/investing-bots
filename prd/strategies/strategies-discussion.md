# Trading Strategy Portfolio

This directory contains a portfolio of 5 complementary trading strategies designed to work across different market regimes. Each strategy is simple (3-5 parameters), thoroughly documented, and aligned with professional risk management principles.

## Strategy Overview

| ID | Name | Type | Market Regime | Timeframe | Holding Period | Win Rate Target | R Multiple Target |
|----|------|------|---------------|-----------|----------------|-----------------|-------------------|
| ST-001 | Higher Timeframe Trend Following | Trend | ADX > 25 | 4H / 1D | 1-5 days | 45-55% | 2.0-2.5 |
| ST-002 | Bollinger Band Mean Reversion | Mean Reversion | ADX < 20 | 1H / 4H | 6h-2 days | 60-70% | 1.5-2.0 |
| ST-003 | Volatility Breakout | Breakout | Low → High Vol | 1D / 1W | 3-14 days | 40-50% | 3.0-4.0 |
| ST-004 | Momentum Continuation | Momentum | ADX > 30 | 1H / 4H | 12h-3 days | 50-60% | 2.0-3.0 |
| ST-005 | Support/Resistance Bounce | Range Trading | ADX < 30 | 4H / 1D | 1-5 days | 60-70% | 1.5-2.5 |

## Portfolio Diversification

### Market Regime Coverage

The portfolio covers all major market regimes:

1. **Trending Markets (ADX > 25):**
   - ST-001: Trend Following (ADX 25-35)
   - ST-004: Momentum Continuation (ADX > 30)

2. **Ranging Markets (ADX < 20):**
   - ST-002: Mean Reversion (ADX < 20)
   - ST-005: Support/Resistance Bounce (ADX < 30)

3. **Transition Markets:**
   - ST-003: Volatility Breakout (captures range → trend transitions)

### Timeframe Diversification

- **Short-term:** ST-004 (12h-3 days), ST-002 (6h-2 days)
- **Medium-term:** ST-001 (1-5 days), ST-005 (1-5 days)
- **Swing:** ST-003 (3-14 days)

### Complementary Nature

Strategies are designed to work together:
- ST-001 and ST-004 can run concurrently (different timeframes, same trend direction)
- ST-002 and ST-005 can run concurrently (different entry signals, same ranging regime)
- ST-003 captures transitions when ST-002/ST-005 fail (breakouts)
- No conflicting signals: Trend strategies auto-disable in ranges, range strategies disable in trends

## Risk Management Framework

### Position Sizing
- **Standard risk:** 1% per trade (ST-001, ST-002, ST-004, ST-005)
- **Higher risk:** 1.5% per trade (ST-003, due to lower frequency)

### Maximum Exposure Limits
- **Per strategy:** 2-3 concurrent positions
- **Total portfolio:** Max 8 positions across all strategies
- **Total risk:** Max 5-6% of capital at risk simultaneously
- **Per asset:** Max 2 positions (can be from different strategies if non-correlated)

### Correlation Management
- If BTC position open, limit altcoin exposure to 1-2 additional positions
- No more than 3 positions in same regime type (trend, range, breakout)
- Never have 5+ correlated altcoin positions (treat as single position)

## Capital Allocation Example

For $10,000 starting capital:

```
Total Capital: $10,000
Risk per trade: 1% = $100 (or 1.5% = $150 for ST-003)

Scenario 1: Balanced across regimes
- ST-001 (Trend): 1 position, $100 risk
- ST-002 (Range): 2 positions, $200 risk
- ST-004 (Momentum): 1 position, $100 risk
Total: 4 positions, $400 risk (4% total risk)

Scenario 2: Strong trend bias
- ST-001 (Trend): 2 positions, $200 risk
- ST-004 (Momentum): 2 positions, $200 risk
- ST-005 (S/R): 1 position, $100 risk
Total: 5 positions, $500 risk (5% total risk)

Scenario 3: Ranging market bias
- ST-002 (Range): 3 positions, $300 risk
- ST-005 (S/R): 2 positions, $200 risk
Total: 5 positions, $500 risk (5% total risk)
```

## Strategy Selection Logic

### Automated Strategy Router

The system should implement a Market Regime Detector that enables/disables strategies automatically:

```
1. Calculate ADX(14) on 1D and 4H
2. Calculate ATR percentile (6-month rolling)
3. Calculate Bollinger Band width percentile

If 1D ADX > 30 and 4H ADX > 30:
   → Enable ST-004 (Strong Momentum)
   → Enable ST-001 (Trend Following)
   → Disable ST-002 (Mean Reversion)

If 1D ADX < 20:
   → Enable ST-002 (Mean Reversion)
   → Enable ST-005 (S/R Bounce)
   → Disable ST-004 (Momentum)

If ATR in bottom 25% for 14+ days:
   → Enable ST-003 (Breakout) - prepare for expansion

If 1D ADX between 20-30:
   → Enable ST-001 (Moderate Trend)
   → Enable ST-005 (S/R with caution)
   → Disable ST-004 (needs stronger momentum)
```

## Performance Monitoring

### Per-Strategy Metrics (Track Weekly)

For each strategy, monitor:
1. **Win Rate:** Must stay within ±5% of target
2. **Average R Multiple:** Must stay above minimum threshold
3. **Profit Factor:** (Gross Wins / Gross Losses) must stay > target
4. **Max Drawdown:** Must not exceed historical × 1.5
5. **Consecutive Losses:** Auto-pause at 3-4 (per strategy specification)

**Q: Do we have a feature for tracking these metrics on the UI/dashboard?**

**A: Yes! You have several features that handle this:**

**Per-Bot Performance Tracking:**
- **FT-100 (Bot Management):** Tracks performance per bot instance
  - Each bot = one instance of a strategy on a specific asset
  - Bot-1: "ST-001 Trend Following v1.0" on BTC/USDT
  - Bot-2: "ST-001 Trend Following v1.0" on ETH/USDT
  - Both use same strategy, but track performance separately

**Per-Strategy Aggregated Analytics:**
- **FT-135 (Live Performance Analytics):** Aggregates across all bots using same strategy
  - Shows "ST-001 v1.0" overall performance across all assets
  - Win rate: 52% (aggregated from 5 bots)
  - Average R: 2.1 (across all trades from all bots)
  - Useful for: "Is this strategy working globally, or just on BTC?"

**Dashboard Widgets:**
- **FT-131 (Main Dashboard UI):** Shows both views
  - Per-bot cards: Individual bot metrics
  - Strategy summary cards: Aggregated strategy performance

**Signal Tracking:**
- **FT-061 (Signal Tracking):** NEW! Just created based on your request
  - Tracks signals that didn't become trades (rejected opportunities)
  - Visualizes on charts: green = executed, yellow = rejected
  - Analytics: "Why are 23% of signals rejected? (Max positions limit)"

**Architecture:**
```
Strategy: ST-001 Trend Following v1.0
   ├── Bot-1 (BTC/USDT): 15 trades, 53% win rate, +8.2% P&L
   ├── Bot-2 (ETH/USDT): 22 trades, 50% win rate, +6.5% P&L
   └── Bot-3 (SOL/USDT): 18 trades, 56% win rate, +11.3% P&L

Aggregated Strategy Performance:
   Total: 55 trades, 53% win rate, +26% P&L, 2.2R average
```

**You're right:** Multiple bots can run the same strategy with slight variations:
- Same strategy, different assets (BTC vs ETH)
- Same strategy, different risk % (1% vs 1.5%)
- Same strategy, different timeframes (if parameterized)

Each bot tracks separately, but you can also view aggregated strategy performance.

### Portfolio Metrics (Track Daily)

1. **Total Capital:** Current account value
2. **Total Risk Exposure:** Sum of all open position risks
3. **Realized P&L:** Daily, weekly, monthly
4. **Unrealized P&L:** Current open positions
5. **Sharpe Ratio:** Monthly calculation (aim for > 1.5)
6. **Max Drawdown:** Portfolio-level (acceptable up to 20%)

### Kill Switches (Auto-Disable Conditions)

Each strategy auto-disables if:
- Win rate drops below minimum (varies by strategy)
- 3-5 consecutive losses (varies by strategy)
- Max drawdown exceeds threshold (varies by strategy)
- Market regime changes (e.g., ADX crosses threshold)
- Major event detected (FOMC, CPI, etc.)

Portfolio-level kill switch:
- Total drawdown exceeds 25%
- 10+ consecutive losses across all strategies
- Margin level critical (if using leverage)

## Implementation Priority

### Phase 1 (Weeks 1-2): Foundation
1. Set up market regime detector (ADX, ATR, BB width)
2. Implement position sizing calculator
3. Build risk management module (max exposure, correlation checks)
4. Create strategy enable/disable logic

### Phase 2 (Weeks 3-4): Core Strategies
1. Implement ST-001 (Trend Following)
2. Implement ST-002 (Mean Reversion)
3. Add kill switches and monitoring

### Phase 3 (Month 2): Expansion
1. Implement ST-003 (Breakout)
2. Implement ST-004 (Momentum)
3. Implement ST-005 (S/R Bounce)

### Phase 4 (Month 2-3): Testing
1. Paper trade all strategies for 30+ days
2. Track performance metrics
3. Adjust parameters if needed (create v1.1 versions, don't modify originals)

### Phase 5 (Month 3+): Live Trading
1. Start with 0.5% risk per trade
2. Only enable strategies with positive paper trading results
3. Scale to 1% risk after 30 days of profitability
4. Scale capital allocation gradually

## Backtesting Requirements

### Minimum Standards

For each strategy:
1. **Data:** Minimum 2 years (preferably 3-4 years)
2. **Assets:** Minimum 3 assets (BTC, ETH, 1 altcoin)
3. **Conditions:** Bull, bear, and sideways markets
4. **Out-of-sample:** 30% of data reserved for validation
5. **Walk-forward:** Rolling window optimization
6. **Transaction costs:** 0.05% per trade (Futures maker/taker average)
7. **Slippage:** 0.1% per trade (conservative estimate)

### Validation Criteria

Strategy passes validation if:
- Win rate within target range across all conditions
- Profit factor > target threshold
- Max drawdown < target threshold
- Works on at least 3 different assets
- Performance stable over time (no sudden degradation)

## Expected Portfolio Performance

### Realistic Targets (Conservative Estimates)

```
Starting Capital: $10,000
Average risk per trade: 1%
Average concurrent positions: 4-6

Scenario 1: Good Performance
- Monthly return: 8-12%
- Win rate: 55-60%
- Average R: 2.0
- Max drawdown: 10-15%
- Annual return: ~100-150% (with compounding)

Scenario 2: Excellent Performance (Rare)
- Monthly return: 15-20%
- Win rate: 60-65%
- Average R: 2.5
- Max drawdown: 12-18%
- Annual return: ~200-300% (with compounding)

Scenario 3: Poor Performance (Learning Phase)
- Monthly return: 0-3%
- Win rate: 45-50%
- Average R: 1.5
- Max drawdown: 18-22%
- Annual return: 0-30%
```

### Reality Check

- First 3 months: Expect break-even or small losses (tuning period)
- Months 4-6: Expect 5-10% monthly if strategies working
- After 6 months: Sustainable 8-15% monthly possible
- **Volatility:** Expect 30-50% drawdowns even with good strategies
- **Consistency:** Some months will lose money (accept this)

## Strategy Versioning and A/B Testing

### Immutable Strategy Principle

Never modify a running strategy. Instead:

1. Current version continues running (e.g., ST-001 v1.0)
2. Create new version with changes (e.g., ST-001 v1.1)
3. Run both versions in parallel for 30-60 days
4. Compare performance metrics
5. Disable underperformer, keep winner

Example:
```
ST-001 v1.0: 20 EMA, ADX 25, ATR 1.5× stops
ST-001 v1.1: 25 EMA, ADX 28, ATR 2.0× stops

After 60 days:
v1.0: 55% win rate, 2.2R average, 12% drawdown
v1.1: 52% win rate, 2.0R average, 15% drawdown
→ Keep v1.0, disable v1.1
```

## Common Failure Modes (What to Avoid)

### Portfolio-Level Mistakes
1. Running too many strategies simultaneously (> 8 positions)
2. Over-allocating to single regime (all trend or all range)
3. Ignoring correlation (5 altcoin positions = 1 giant position)
4. Not respecting kill switches (letting losers run)
5. Modifying strategies mid-run (destroys performance tracking)

### Strategy-Level Mistakes
1. Trading wrong regime (trend strategy in range, vice versa)
2. Ignoring higher timeframe (trading against major trend)
3. Poor stop placement (arbitrary % instead of market structure)
4. Overtrading (forcing signals when conditions not met)
5. Revenge trading after losses (emotional overrides)

### Risk Management Mistakes
1. Position sizing too large (> 2% per trade)
2. Total exposure too high (> 6% capital at risk)
3. Not using stop losses (hoping price recovers)
4. Moving stop losses further away (increasing risk)
5. Letting small losses become large losses

## Advanced Portfolio Concepts

### Kelly Criterion (Optional, Advanced)

For experienced traders who want to optimize position sizing:

```
Kelly % = (Win Rate × Avg Win) - (Loss Rate × Avg Loss) / Avg Win

Example:
Win Rate: 60%
Avg Win: 2R
Loss Rate: 40%
Avg Loss: 1R

Kelly = (0.6 × 2) - (0.4 × 1) / 2 = (1.2 - 0.4) / 2 = 0.4 = 40%

Use Half-Kelly: 20% per trade (too aggressive for most)
Use Quarter-Kelly: 10% per trade (still aggressive)
Conservative: 1-2% per trade (recommended)
```

**Warning:** Kelly can be too aggressive. Stick to 1-2% per trade unless very experienced.

### Dynamic Position Sizing (Optional)

Adjust position size based on recent performance:

```
Base Risk: 1%

After 3 consecutive wins: Increase to 1.2%
After 5 consecutive wins: Increase to 1.5%
After 2 consecutive losses: Decrease to 0.8%
After 4 consecutive losses: Decrease to 0.5%

Always reset to 1% after 10 trades
```

## Documentation and Record-Keeping

### Required Records

1. **Trade Log:** Every trade with entry, exit, P&L, strategy used
2. **Strategy Log:** Performance metrics per strategy (weekly)
3. **Market Regime Log:** Daily ADX, ATR, BB width readings
4. **Event Log:** Major events (FOMC, CPI, etc.) and impact
5. **Code Changes Log:** Version changes, A/B test results

### Review Schedule

- **Daily:** Check open positions, total risk exposure, regime detector
- **Weekly:** Review per-strategy metrics, adjust enabled strategies
- **Monthly:** Full portfolio review, calculate Sharpe ratio, update projections
- **Quarterly:** Major strategy audit, consider new strategies or parameters

## Next Steps

1. Review each strategy file in detail
2. Understand market regime requirements for each
3. Build market regime detector first (foundation)
4. Implement strategies one at a time (don't rush)
5. Paper trade for 30+ days before going live
6. Start with smallest position sizes (0.5% risk)
7. Scale gradually as confidence builds

## Questions to Answer Before Implementation

### Q1: Do I have 2+ years of historical data for backtesting?

**Answer:** Yes, via FT-115 (Historical Data Management). You don't use ad-hoc requests because:
1. **Speed:** Fetching 2 years of 4H candles via API takes hours; local database = seconds
2. **Rate Limits:** Exchanges limit requests (e.g., 50/min); backtesting needs millions of candles
3. **Reliability:** Exchange APIs can be down; local data is always available
4. **Data Quality:** FT-115 cleans/validates data once; live APIs may have gaps/errors
5. **Cost:** Some exchanges charge for historical data beyond 1 year

**Your Feature:** FT-115 handles downloading, storing, and serving historical data from TimescaleDB.

**Action:** Implement FT-115 first. Download 2-4 years of daily/4H/1H candles for BTC, ETH, and 5-10 major altcoins from ByBit/Binance. Store locally in TimescaleDB.

### Q2: Do I understand ADX, RSI, ATR, and EMA indicators?

**Quick Explanation:**

**RSI (Relative Strength Index):** ✅ You know this
- 0-100 scale
- > 70 = overbought, < 30 = oversold
- Measures momentum

**EMA (Exponential Moving Average):** ✅ You understand moving averages
- Like SMA but gives more weight to recent prices
- EMA(20) = average of last 20 candles with recency bias
- Price above EMA = uptrend, below = downtrend

**ATR (Average True Range):** You need this
- Measures volatility (how much price moves per candle)
- Example: BTC ATR = $1,500 means it typically moves $1,500/day
- Used for: Stop loss placement (ATR × 1.5 = minimum stop distance)
- **Learn:** ATR = average of (high - low) over 14 periods
- **Why it matters:** In strategies, you use ATR to place stops that account for normal market noise

**ADX (Average Directional Index):** You need this most
- **Critical for regime detection!**
- 0-100 scale measuring **trend strength** (not direction)
- < 20 = ranging/sideways (no trend)
- 20-25 = weak trend
- 25-40 = strong trend
- > 40 = very strong trend
- **Learn:** ADX combines +DI and -DI to show if price is trending or choppy
- **Why it matters:** Your entire strategy router depends on ADX to enable/disable strategies

**Action:**
1. Watch 15-minute YouTube tutorials on ATR and ADX (search "ADX indicator explained")
2. Open TradingView, add ADX and ATR to BTC chart, observe for 1 week
3. Notice: When ADX > 30, price trends strongly; when ADX < 20, price oscillates

### Q3: Can I code the market regime detector accurately?

**Answer:** Yes, with AI assistance + validation. Here's the approach:

**Step 1: Use libraries** (don't code from scratch)
```javascript
// Use ta-lib or technicalindicators npm package
import { ADX, ATR, RSI, EMA } from 'technicalindicators';

const adx = ADX.calculate({
  high: highPrices,
  low: lowPrices,
  close: closePrices,
  period: 14
});
```

**Step 2: Validate against TradingView**
1. Open TradingView chart for BTC
2. Add ADX(14), ATR(14), RSI(14)
3. Pick a specific date, e.g., "2024-01-15 12:00 UTC"
4. Record TradingView values: ADX = 28.5, ATR = $1,200, RSI = 62
5. Run your code for same date
6. Compare: Your ADX should = 28.5 ± 0.1 (allow tiny rounding differences)
7. Repeat for 10 random dates across bull/bear/sideways markets

**Step 3: Validate regime classification**
```javascript
// Test case: BTC consolidating $60k-$64k for 3 weeks
// Expected: ADX < 20, regime = "Ranging"

const testData = loadHistoricalData("BTC/USDT", "2024-07-01", "2024-07-21");
const regime = detectRegime(testData);
assert(regime.trend === "Ranging");
assert(regime.adx < 20);
```

**Action:** Implement FT-140 (Market Regime Detection) using existing TA libraries. Validate against manual TradingView analysis for 20 test cases.

### Q4: Do I have API access to exchange for automated trading?

**Answer:** Yes, ByBit and Binance offer free API access. Setup steps:

**ByBit (Recommended for Futures):**
1. Create account → API Management
2. Generate API Key with permissions: "Trade", "Position", "Order"
3. Start with **Testnet** (paper trading): testnet.bybit.com
4. Testnet = free fake money, real exchange engine
5. After 30 days successful testnet → switch to real API

**Binance:**
1. Similar process, also has testnet
2. Lower futures fees than spot margin

**Your Feature:** FT-010 (Exchange Connectivity) + FT-060 (Paper Trading/Testnet Mode)

**Action:**
1. Month 1-2: Use ByBit Testnet exclusively (FT-060)
2. Month 3+: Switch to real API with minimum capital ($500-1000)

### Q5: Have I tested position sizing calculations?

**What this means:** Can you manually calculate position size given entry, stop, and risk?

**The Formula:**
```
Position Size = (Capital × Risk%) / Distance to Stop Loss

Example:
Capital: $10,000
Risk: 1% = $100
Entry: $60,000
Stop: $58,800
Distance: $1,200 (2%)

Position Size = $100 / $1,200 = 0.0833 BTC
Position Value = 0.0833 × $60,000 = $5,000

Check: If stop hits, loss = 0.0833 × $1,200 = $100 ✓
```

**Testing:** Create spreadsheet with 10 scenarios, calculate manually, then verify your code produces same results.

**Your Feature:** FT-091 (Risk Management Framework) - includes automated position sizing

**Action:**
1. Build position sizing calculator first (before any strategies)
2. Test with 20 different scenarios (tight stops, wide stops, different capitals)
3. Ensure it never allows position larger than total capital
4. Ensure it always risks exactly 1% (not 0.9% or 1.1%)

### Q6: Do I have monitoring/alerting system ready?

**Answer:** No, but you will via FT-130 (Monitoring & Alerts)

**What you need:**
1. **Position opened/closed alerts** (Telegram/email)
2. **Strategy disabled alerts** (regime changed, kill switch hit)
3. **Drawdown alerts** (portfolio down 10%, 15%, 20%)
4. **Error alerts** (API failed, bot crashed, position stuck)

**Your Feature:** FT-130 (Monitoring & Alerts)

**Action:** Implement FT-130 early (month 1). Use Telegram Bot API (free, simple). Critical for catching issues before they become disasters.

### Q7: Am I prepared to accept 20-30% drawdowns?

**Your Response:** "I would love to limit them to 15-30%. I heard that 50-60% is too much."

**Answer:** You're absolutely right. Here's the reality:

**Professional Traders:**
- 10-15% drawdown: Excellent risk management
- 15-25% drawdown: Good, acceptable
- 25-35% drawdown: Painful but survivable
- 35-50% drawdown: Dangerous, many traders quit
- 50%+ drawdown: Catastrophic, very hard to recover

**Your Target (15-30%) is realistic and smart.**

**How to limit drawdowns:**
1. **Portfolio kill switch** (FT-091): Stop all trading if down 20-25%
2. **Daily stop loss:** Max 3-5% loss per day
3. **Position limits:** Max 6% total risk (6 positions × 1% each)
4. **Regime detection:** Auto-pause in unfavorable conditions (FT-140)
5. **Correlation limits:** No more than 3 correlated positions

**Math:**
```
If you risk 1% per trade, max 6 concurrent positions:
- All 6 hit stop loss = 6% loss (one bad day)
- 3 bad days in a row = 18% drawdown
- With win rate 50%, 20% drawdown very rare
```

**Your Features:** FT-091 (Portfolio Risk Controls) includes drawdown circuit breakers

**Action:** Set hard limits in FT-091:
- Daily loss limit: 5%
- Weekly loss limit: 10%
- Max drawdown: 25% (shut down everything, manual review required)

### Q8: Do I have 3-6 months for testing before expecting profits?

**Your Response:** "Yes, I do."

**Answer:** Perfect. Realistic timeline:

**Month 1-2:** Build + Paper Trading
- Implement core features (FT-010, FT-070, FT-091, FT-100, FT-115, FT-140)
- Deploy 2-3 strategies on ByBit Testnet
- Fix bugs, tune parameters
- **Expected P&L:** $0 (fake money)

**Month 3-4:** Live with Micro Capital
- Switch to real API with $500-1000
- Risk 0.5% per trade (not 1%)
- Validate strategies actually work in live conditions
- **Expected P&L:** -5% to +10% (learning curve)

**Month 5-6:** Scale Gradually
- If profitable, increase capital to $5,000-10,000
- Increase risk to 1% per trade
- Add more strategies
- **Expected P&L:** +5% to +15% monthly

**Month 7+:** Full Operation
- Scale to target capital
- Run full portfolio of 5 strategies
- **Expected P&L:** +8% to +20% monthly (if all goes well)

### Q9: Have I set up proper risk management limits?

**Your Response:** "If you look at my features, I think I have this somewhere."

**Answer:** Yes! You have FT-091 (Risk Management Framework)

**What FT-091 includes:**
- **Per-Trade Controls:** Position sizing, stop loss enforcement
- **Portfolio Controls:** Drawdown circuit breakers, asset concentration limits

**What you need to configure:**
```javascript
// Risk Limits Configuration
const riskConfig = {
  // Per-Trade
  maxRiskPerTrade: 0.01,  // 1%
  maxPositionSize: 0.10,   // Max 10% of capital in one position

  // Portfolio
  maxConcurrentPositions: 8,
  maxTotalRisk: 0.06,      // Max 6% total risk
  maxAssetConcentration: 0.25,  // Max 25% of capital in one asset

  // Drawdown Limits
  maxDailyLoss: 0.05,      // 5%
  maxWeeklyLoss: 0.10,     // 10%
  maxDrawdown: 0.25,       // 25% (kill switch)

  // Correlation
  maxCorrelatedPositions: 3,  // Max 3 BTC-correlated positions
};
```

**Action:** Implement FT-091 with these exact limits. They align with your 15-30% drawdown tolerance.

### Q10: Do I understand correlation between crypto assets?

**Your Response:** "Yes, absolutely! I have two years of experience..."

**Answer:** This is your HUGE advantage! Your experience gives you:

1. **Intuition:** You know when BTC drops, altcoins usually drop harder
2. **BTC Dominance:** You track this daily - critical for regime detection
3. **Sector Rotation:** You understand ETH/DeFi/L1/Meme coin dynamics
4. **Market Psychology:** You've lived through bull runs, crashes, FUD cycles

**How to use this in strategies:**

**BTC Dominance Strategy Idea:**
```
When BTC Dominance rising (money flowing into BTC):
→ Trade BTC strategies only
→ Pause altcoin strategies

When BTC Dominance falling (alt season):
→ Increase altcoin allocation
→ Trade momentum strategies on top gainers
```

**Correlation Rules to Implement:**
```javascript
// Crypto Correlation Groups
const correlationGroups = {
  btcGroup: ["BTC/USDT"],
  ethGroup: ["ETH/USDT", "ARB/USDT", "OP/USDT"],  // ETH ecosystem
  layer1Group: ["SOL/USDT", "AVAX/USDT", "SUI/USDT"],
  memeGroup: ["DOGE/USDT", "SHIB/USDT", "PEPE/USDT"],
};

// Rule: Max 1 position per group
// If already have ETH/USDT position, skip ARB/USDT signal (too correlated)
```

**Your Advantage:** You can manually review correlation instead of relying purely on statistical correlation (which lags). You KNOW that during crashes, everything correlates to 0.9+, but during calm periods, correlation is lower.

**Action:**
1. Add "Correlation Group" field to FT-100 (Bot Management)
2. Implement rule: "Max 1 active bot per correlation group"
3. During testing, manually verify: "When BTC dumps 10%, do my altcoin bots all lose together?" (If yes, they're too correlated)

## Implementation Checklist Summary

Based on your answers:

- [x] Historical data: FT-115 (need to implement)
- [x] Indicator knowledge: Learn ATR and ADX (15 min each)
- [x] Regime detector: FT-140 + validation tests
- [x] API access: ByBit Testnet → Live
- [ ] Position sizing: Build calculator + test 20 scenarios
- [x] Monitoring: FT-130 (need to implement)
- [x] Drawdown tolerance: 15-30% (configure in FT-091)
- [x] Testing timeline: 3-6 months ✓
- [x] Risk limits: FT-091 (configure limits)
- [x] Correlation: Your experience + implement group limits

## Final Thoughts

This portfolio is designed for **systematic, disciplined execution**. The strategies are simple, but success depends on:

1. **Strict adherence to regime rules** (don't trade trend strategies in ranges)
2. **Proper risk management** (1% per trade, max 6% total exposure)
3. **Patience** (3-6 months to tune and validate)
4. **Emotional discipline** (follow kill switches, accept losses)
5. **Continuous monitoring** (track metrics, disable underperformers)

**Most traders fail not because their strategies are bad, but because they:**
- Trade the wrong strategy in the wrong market regime
- Use poor position sizing (too large or arbitrary)
- Ignore stop losses and let losses grow
- Don't track performance systematically
- Keep modifying strategies instead of letting them run

Avoid these mistakes, follow the framework, and you have a solid foundation for algorithmic trading.

Good luck!
