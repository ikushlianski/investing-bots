id: ST-002
name: Bollinger Band Mean Reversion
type: Mean Reversion
market_regime: Ranging (ADX < 20)
timeframe: 1H entry, 4H confirmation
holding_period: 6 hours - 2 days
complexity: Simple (4 parameters)

## Strategy Hypothesis

In ranging markets, price tends to revert to the mean after reaching extremes. Bollinger Bands (2 standard deviations) identify overbought/oversold conditions, offering high-probability mean reversion setups when ADX confirms lack of trend.

## Market Regime Requirements

### Enable Strategy When
- 4H ADX < 20 (ranging, not trending)
- 1D price contained within established range for 7+ days
- Bollinger Bands width stable (not expanding rapidly)
- Volume normal (not extreme spikes or dries up)

### Disable Strategy When
- 4H ADX > 25 (trending market forming)
- Bollinger Bands expanding rapidly (> 50% width increase in 24h)
- Major event within 24 hours
- Volume < 50% average (low liquidity)
- 3 consecutive losses

## Entry Rules

### LONG Setup (Oversold Bounce)
1. 4H timeframe: ADX < 20 (confirming range)
2. 1H timeframe: Price touches or breaches lower Bollinger Band
3. RSI(14) on 1H < 30 (oversold confirmation)
4. Entry trigger: 1H candle closes INSIDE lower BB (rejection of extreme)
5. Volume: Current candle volume > 0.8× average

### SHORT Setup (Overbought Rejection)
1. 4H timeframe: ADX < 20 (confirming range)
2. 1H timeframe: Price touches or breaches upper Bollinger Band
3. RSI(14) on 1H > 70 (overbought confirmation)
4. Entry trigger: 1H candle closes INSIDE upper BB (rejection of extreme)
5. Volume: Current candle volume > 0.8× average

## Risk Management

### Stop Loss Placement
- LONG: Below the lowest wick of entry candle minus ATR × 1.0
- SHORT: Above the highest wick of entry candle plus ATR × 1.0
- Maximum distance: 3% from entry (if wider, skip trade)
- Minimum distance: 1% from entry (if tighter, market too quiet)

### Take Profit
- Target 1 (primary): Middle Bollinger Band (50% position)
- Target 2: Opposite Bollinger Band (30% position)
- Target 3: Trailing stop at 0.5 standard deviations from mean (20% position)

### Position Sizing
```
Risk per trade: 1% of capital
Position Size = (Capital × 0.01) / Distance to Stop Loss

Example:
Capital: $10,000
Risk: $100 (1%)
Entry: $59,000 (at lower BB)
Stop: $58,200 (1.35% below)
Distance: $800
Position: $100 / $800 = 0.125 BTC
```

## Time Management

### Expected Holding Period
- Minimum: 3 hours (mean reversion attempts)
- Typical: 6-24 hours
- Maximum: 2 days

### Time Stop
If position hasn't reached Target 1 (middle BB) within 48 hours, close at market. Mean reversion should be relatively quick; extended holds suggest regime change.

## Exit Rules

### Normal Exits
1. Target 1 hit (middle BB): Close 50%, move stop to breakeven
2. Target 2 hit (opposite BB): Close 30%, trail remaining
3. Trailing stop hit: Close remaining 20%

### Emergency Exits
1. ADX rises above 25 on 4H (trend forming, stop mean reversion)
2. Bollinger Bands expand > 50% (volatility spike)
3. Time stop reached (48 hours)
4. Stop loss hit
5. Price breaks range boundary (4H close beyond established range)

## Performance Expectations

### Target Metrics
- Win rate: 60-70% (mean reversion has higher win rate, smaller R)
- Average R multiple: 1.5-2.0
- Profit factor: > 1.8
- Max drawdown: < 10%

### When to Disable
- Win rate drops below 55% over 20 trades
- Profit factor drops below 1.5
- 4 consecutive losses
- Max drawdown exceeds 15%

## Backtesting Parameters

### Assets to Test
- BTC/USDT
- ETH/USDT
- High-volume altcoins (consistent liquidity)

### Timeframe
- Minimum: 2 years of data
- Focus on consolidation periods (30-40% of all market data)
- Exclude strong trending periods from analysis

### Validation
- Out-of-sample testing: 30% of data
- Separate backtests for bull consolidations vs bear consolidations
- Must maintain 60%+ win rate across all conditions

## Implementation Notes

### Technical Indicators Required
- Bollinger Bands(20, 2) on 1H
- ADX(14) on 4H
- RSI(14) on 1H
- ATR(14) on 1H
- Volume MA(20) on 1H

### API Requirements
- 1H candle data
- Real-time price updates (every 1-2 minutes)
- Fast order execution (limit orders at current price)
- Stop loss / take profit orders

### Monitoring Alerts
- Position opened (oversold/overbought signal)
- Target 1 reached (50% closed at middle BB)
- Target 2 reached (30% closed at opposite BB)
- ADX rising above 25 (regime change warning)
- Bollinger Bands expanding rapidly
- Time stop approaching (36 hours notification)
- Strategy disabled (kill switch triggered)

## Correlation Rules

### Maximum Exposure
- No more than 3 concurrent positions in this strategy
- No more than 1 position per asset
- Mean reversion positions can coexist with trend strategies (different regimes)
- Total risk across all mean reversion positions: max 2% of capital

## Strategy Versioning

### Current Version: 1.0

### Change Log
- v1.0 (initial): BB(20,2), ADX < 20, RSI < 30 / > 70, 48h time stop

### Future Improvements (Track Performance First)
- Test different BB periods (15, 25)
- Test different standard deviations (1.5, 2.5)
- Test different RSI thresholds (25/75, 35/65)
- Add volume profile for better entry timing
- Test different time stops (24h, 72h)

### Modification Rules
Never modify this version. If changes needed, create ST-002 v1.1 and run both in parallel for comparison.

## Real-World Example

### Scenario: BTC Range-Bound Consolidation
```
Date: 2024-04-20
4H: BTC consolidating between $62k-$66k for 10 days, ADX = 16
1H: BTC drops to $62,100, touching lower BB at $62,000
RSI: 28 (oversold)

Entry Signal:
- 4H ADX = 16 (ranging confirmed)
- 1H price touches lower BB
- RSI < 30
- 1H candle closes at $62,300 (INSIDE lower BB, rejection)
- Volume: 1.1x average
- Entry: $62,300

Stop Loss:
- Entry candle low: $62,000
- ATR(14) on 1H: $450
- Stop: $62,000 - $450 = $61,550
- Distance: 1.2%

Position Sizing:
- Capital: $10,000
- Risk: $100
- Entry: $62,300, Stop: $61,550
- Distance: $750
- Position: $100 / $750 = 0.1333 BTC

Targets:
- T1 (middle BB): $64,000 (50% position)
- T2 (upper BB): $66,000 (30% position)
- T3: Trailing at 0.5 std dev from mean (20%)

Outcome (example):
- 8 hours: T1 hit at $64,000, close 50% for $113 profit
- 20 hours: T2 hit at $66,000, close 30% for $148 profit
- 24 hours: Trail stop at $65,500, close 20% for $85 profit
- Total: $346 profit on $100 risk = 3.46R
```

### Scenario: Failed Mean Reversion (Emergency Exit)
```
Date: 2024-05-15
Entry: SHORT at $68,000 (upper BB touch, RSI 72)
Stop: $68,800 (1.17%)

Hour 6: Price consolidates at $68,200
Hour 12: 4H ADX rises to 23 (trend forming)
Hour 15: 4H ADX hits 26 (trending)

Emergency Exit:
- Exit at market: $68,400
- Loss: $400 / $10,000 = 4% (but only $100 actual loss due to position sizing)
- Reason: ADX > 25, trend forming, mean reversion invalidated
```

## Critical Success Factors

1. Only trade during ranging markets (ADX < 20)
2. Wait for candle close inside BB (confirmation of rejection)
3. Always check RSI for oversold/overbought confirmation
4. Respect time stops (mean reversion should be quick)
5. Exit immediately if ADX rises above 25
6. Don't trade this strategy during trending markets

## Strategy Psychology

### Why This Works
- In ranges, price oscillates between support/resistance
- Bollinger Bands dynamically adjust to volatility
- Extreme touches (< 5% of candles) offer asymmetric risk/reward
- RSI adds momentum confirmation

### Why This Fails
- Trend breakouts: Price "walks" the BB without reverting
- Low volatility: BB contracts, targets too close for good R/R
- News events: Sudden regime change invalidates range assumption

## Complementary Strategies

This strategy works well alongside:
- ST-001 (Trend Following): Different market regimes
- ST-003 (Breakout): Catches range breakouts when ST-002 fails

Avoid running alongside:
- Other mean reversion strategies: Correlated signals
- Counter-trend strategies: Conflicting signals

## Final Checklist Before Every Trade

- [ ] 4H ADX < 20?
- [ ] Price touched BB extreme?
- [ ] RSI oversold (< 30) or overbought (> 70)?
- [ ] 1H candle closed INSIDE BB (rejection)?
- [ ] Volume adequate (> 0.8× average)?
- [ ] Stop loss within 1-3% range?
- [ ] Position sized for 1% risk?
- [ ] No major events in next 24 hours?
- [ ] Strategy not on pause (no 3 consecutive losses)?
- [ ] Bollinger Bands not rapidly expanding?
