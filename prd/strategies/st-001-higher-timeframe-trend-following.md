id: ST-001
name: Higher Timeframe Trend Following
type: Trend Following
market_regime: Trending (ADX > 25)
timeframe: 4H entry, 1D confirmation
holding_period: 1-5 days
complexity: Simple (3 parameters)

## Strategy Hypothesis

Price tends to continue in the direction of the higher timeframe trend. When 1D and 1W timeframes align, 4H pullbacks offer high-probability entries with favorable risk/reward.

## Market Regime Requirements

### Enable Strategy When
- 1W trend clear (20 EMA slope > 0 for LONG, < 0 for SHORT)
- 1D ADX > 25 (trending, not ranging)
- 1D ATR within normal range (not spiking > 150% average)
- Volume > 70% of 20-day average

### Disable Strategy When
- 1D ADX < 20 (ranging market)
- 1D ATR > 150% of 20-day average (excessive volatility)
- Major event within 24 hours (FOMC, CPI, etc.)
- 3 consecutive losses (pause for review)

## Entry Rules

### LONG Setup
1. 1W timeframe: Price above 20 EMA
2. 1D timeframe: Price above 20 EMA AND ADX > 25
3. 4H timeframe: Price pulls back to 20 EMA after uptrend
4. Entry trigger: 4H candle closes above 20 EMA with bullish momentum
5. Volume confirmation: Current 4H volume > average 4H volume

### SHORT Setup
1. 1W timeframe: Price below 20 EMA
2. 1D timeframe: Price below 20 EMA AND ADX > 25
3. 4H timeframe: Price rallies to 20 EMA after downtrend
4. Entry trigger: 4H candle closes below 20 EMA with bearish momentum
5. Volume confirmation: Current 4H volume > average 4H volume

## Risk Management

### Stop Loss Placement
- LONG: Below recent 4H swing low minus (ATR × 1.5)
- SHORT: Above recent 4H swing high plus (ATR × 1.5)
- Minimum distance: 2% from entry (account for noise)
- Maximum distance: 5% from entry (if wider, skip trade)

### Take Profit
- Target 1: Risk × 2 (50% position close)
- Target 2: Risk × 3 (25% position close)
- Target 3: Trailing stop at 20 EMA on 4H (remaining 25%)

### Position Sizing
```
Risk per trade: 1% of capital
Position Size = (Capital × 0.01) / Distance to Stop Loss

Example:
Capital: $10,000
Risk: $100 (1%)
Entry: $60,000
Stop: $58,800 (2%)
Distance: $1,200
Position: $100 / $1,200 = 0.0833 BTC
```

## Time Management

### Expected Holding Period
- Minimum: 6 hours (1.5 × 4H candles)
- Typical: 1-3 days
- Maximum: 5 days

### Time Stop
If position hasn't reached Target 1 within 5 days, close at market regardless of P&L. This prevents 4H trades from turning into unplanned multi-week holds.

## Exit Rules

### Normal Exits
1. Target 1 hit: Close 50%, move stop to breakeven
2. Target 2 hit: Close 25%, trail remaining
3. Trailing stop hit: Close remaining 25%

### Emergency Exits
1. 1D candle closes against trend (below 20 EMA for LONG, above for SHORT)
2. Time stop reached (5 days)
3. Stop loss hit
4. Market regime changes (ADX drops below 20)

## Performance Expectations

### Target Metrics
- Win rate: 45-55%
- Average R multiple: 2.0-2.5
- Profit factor: > 1.5
- Max drawdown: < 15%

### When to Disable
- Win rate drops below 40% over 20 trades
- Profit factor drops below 1.2
- 5 consecutive losses
- Max drawdown exceeds 20%

## Backtesting Parameters

### Assets to Test
- BTC/USDT
- ETH/USDT
- Major altcoins (top 10 by volume)

### Timeframe
- Minimum: 2 years of data
- Include both bull and bear markets
- Test across multiple market cycles

### Validation
- Out-of-sample testing: 30% of data
- Walk-forward analysis
- Must work on at least 3 different assets

## Implementation Notes

### Technical Indicators Required
- EMA(20) on 1W, 1D, 4H
- ADX(14) on 1D
- ATR(14) on 4H
- Volume MA(20) on 4H

### API Requirements
- 4H candle data
- Real-time price updates (every 5 minutes sufficient)
- Order placement (limit orders)
- Stop loss / take profit orders (built-in exchange features)

### Monitoring Alerts
- Position opened
- Target 1 reached (50% closed)
- Target 2 reached (25% closed)
- Stop loss triggered
- Time stop approaching (day 4 notification)
- Strategy disabled (kill switch triggered)

## Correlation Rules

### Maximum Exposure
- No more than 2 concurrent positions in this strategy
- No more than 1 position per asset
- If BTC position open, limit altcoin exposure to 1 additional position
- Total risk across all positions: max 3% of capital

## Strategy Versioning

### Current Version: 1.0

### Change Log
- v1.0 (initial): 20 EMA, ADX 25, ATR 1.5x for stops

### Future Improvements (Track Performance First)
- Test different EMA periods (15, 25, 30)
- Test different ADX thresholds (20, 30)
- Add volume profile analysis for better entries
- Test different time stops (3 days, 7 days)

### Modification Rules
Never modify this version. If changes needed, create ST-001 v1.1 and run both in parallel for comparison.

## Real-World Example

### Scenario: BTC Bull Trend Pullback
```
Date: 2024-03-15
1W: BTC at $68,000, above 20 EMA ($62,000), trending up
1D: BTC at $68,000, above 20 EMA ($66,000), ADX = 32
4H: BTC pulled back to $67,200 (touching 20 EMA at $67,000)

Entry Signal:
- 4H candle closes at $67,500 (above 20 EMA)
- Volume: 1.2x average
- Entry: $67,500

Stop Loss:
- Recent 4H swing low: $66,800
- ATR(14) on 4H: $800
- Stop: $66,800 - $1,200 = $65,600
- Distance: 2.8%

Position Sizing:
- Capital: $10,000
- Risk: $100
- Entry: $67,500, Stop: $65,600
- Distance: $1,900
- Position: $100 / $1,900 = 0.0526 BTC

Targets:
- T1 (2R): $67,500 + $3,800 = $71,300
- T2 (3R): $67,500 + $5,700 = $73,200
- T3: Trail at 4H 20 EMA

Outcome (example):
- Day 2: T1 hit at $71,300, close 50% for $200 profit
- Day 3: T2 hit at $73,200, close 25% for $150 profit
- Day 5: Trailing stop hit at $72,000, close 25% for $118 profit
- Total: $468 profit on $100 risk = 4.68R
```

## Critical Success Factors

1. Never trade this strategy during ranging markets (ADX < 20)
2. Always check 1W and 1D alignment before entry
3. Respect time stops (don't hold beyond 5 days)
4. Use proper position sizing (1% risk per trade)
5. Monitor correlation (max 2 positions total)
6. Track performance and disable if metrics degrade

## Final Checklist Before Every Trade

- [ ] 1W trend aligned?
- [ ] 1D ADX > 25?
- [ ] 4H pullback to 20 EMA?
- [ ] Volume confirmation?
- [ ] Stop loss within 2-5% range?
- [ ] Position sized for 1% risk?
- [ ] No correlated positions open?
- [ ] No major events in next 24 hours?
- [ ] Strategy not on pause (no 3 consecutive losses)?
