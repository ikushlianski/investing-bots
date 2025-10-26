id: ST-005
name: Support/Resistance Bounce
type: Range Trading
market_regime: Ranging or Light Trending
timeframe: 4H entry, 1D confirmation
holding_period: 1-5 days
complexity: Simple (3 parameters)

## Strategy Hypothesis

Price respects key support and resistance levels established through multiple touches and historical significance. When price approaches these levels with confluence factors (volume, candlestick patterns, indicator oversold/overbought), high-probability bounce setups emerge. This strategy captures the "middle" of ranges by buying support and selling resistance.

## Market Regime Requirements

### Enable Strategy When
- Clear support/resistance level identified (3+ touches over 30+ days)
- Price approaching key level within 2% proximity
- 1D ADX < 30 (ranging or moderate trend, not strong trend)
- Volume profile shows high activity at the level (confirmation of significance)
- No major trendline break in progress

### Disable Strategy When
- Strong trend established (1D ADX > 35)
- Support/resistance level broken with conviction (close beyond + high volume)
- Volatility spike (ATR > 150% of average)
- Major event within 24 hours
- 3 consecutive failures at same level (level losing significance)

## Entry Rules

### LONG at Support
1. 1D timeframe: Established support level (3+ touches, 30+ days old)
2. Price within 2% of support level
3. Volume declining on approach (not panic selling)
4. Entry trigger options:
   - Bullish engulfing or hammer candle on 4H at support
   - RSI(14) < 35 on 4H + bullish rejection candle
   - Price touches support + next 4H candle closes higher
5. Confluence: At least 2 of the following:
   - Round number support ($60k, $65k, etc.)
   - Previous resistance turned support
   - 200 EMA on 1D nearby
   - Fibonacci retracement level (0.618, 0.5, 0.382)

### SHORT at Resistance
1. 1D timeframe: Established resistance level (3+ touches, 30+ days old)
2. Price within 2% of resistance level
3. Volume declining on approach (not breakout volume)
4. Entry trigger options:
   - Bearish engulfing or shooting star candle on 4H at resistance
   - RSI(14) > 65 on 4H + bearish rejection candle
   - Price touches resistance + next 4H candle closes lower
5. Confluence: At least 2 of the following:
   - Round number resistance
   - Previous support turned resistance
   - 200 EMA on 1D nearby
   - Fibonacci retracement level

## Risk Management

### Stop Loss Placement
- LONG: 1% below support level (allow for false breakdowns)
- SHORT: 1% above resistance level (allow for false breakouts)
- Alternative: Use ATR × 2.0 from entry if level is very tight
- Maximum distance: 5% from entry
- Minimum distance: 2% from entry

### Take Profit
- Target 1: 50% of distance to opposite level (e.g., if range is $60k-$64k, T1 at $62k from $60k entry)
- Target 2: 75% of distance to opposite level
- Target 3: Opposite level minus 1% (don't aim for exact resistance/support)

### Position Sizing
```
Risk per trade: 1% of capital
Position Size = (Capital × 0.01) / Distance to Stop Loss

Example (LONG at Support):
Capital: $10,000
Risk: $100 (1%)
Entry: $60,200 (at support)
Stop: $59,600 (1% below support at $60k)
Distance: $600 (1%)
Position: $100 / $600 = 0.1666 BTC
```

## Time Management

### Expected Holding Period
- Minimum: 12 hours (allow bounce to develop)
- Typical: 2-4 days
- Maximum: 7 days

### Time Stop
If position hasn't reached Target 1 within 5 days:
- If price still holding above support (LONG) or below resistance (SHORT): keep position
- If price stagnating or drifting toward stop: close position

## Exit Rules

### Normal Exits
1. Target 1 hit (50% range): Close 50%, move stop to breakeven
2. Target 2 hit (75% range): Close 30%, trail remaining
3. Opposite level approached: Close remaining 20% before reaching (take profit at 99% of range)

### Emergency Exits
1. Level broken with conviction (4H close beyond level + volume > 1.5× average)
2. Stop loss hit
3. Opposite level hit but price immediately reverses (failed range completion)
4. New lower low (LONG) or higher high (SHORT) made outside the established range
5. 1D ADX spikes above 35 (strong trend forming, range breaking)

## Performance Expectations

### Target Metrics
- Win rate: 60-70% (support/resistance bounces have high success rate in ranges)
- Average R multiple: 1.5-2.5
- Profit factor: > 1.8
- Max drawdown: < 10%

### When to Disable
- Win rate drops below 55% over 20 trades
- 3 consecutive losses at same level (level no longer valid)
- Profit factor drops below 1.5
- Max drawdown exceeds 15%

## Backtesting Parameters

### Assets to Test
- BTC/USDT (primary)
- ETH/USDT
- Major altcoins with established ranges

### Timeframe
- Minimum: 2 years of data
- Focus on ranging periods (50% of market time)
- Test performance during sideways consolidations
- Measure success rate at round numbers vs arbitrary levels

### Validation
- Out-of-sample testing: 30% of data
- Test different types of levels (round numbers, historical, EMAs)
- Must maintain 60%+ win rate

## Implementation Notes

### Technical Indicators Required
- Historical high/low database (identify support/resistance)
- Volume profile (confirm level significance)
- RSI(14) on 4H
- ATR(14) on 4H
- ADX(14) on 1D
- EMA(200) on 1D
- Fibonacci retracement tool

### API Requirements
- 4H candle data
- 1D candle data
- Historical price data (6+ months for level identification)
- Volume profile data
- Real-time price updates (every 5 minutes)
- Order placement (limit orders at levels)
- Stop loss / take profit orders

### Monitoring Alerts
- Price approaching key level (within 3%)
- Proximity alert (within 1% of level)
- Entry trigger detected (candlestick pattern + confluence)
- Position opened
- Target 1 reached (50% closed)
- Target 2 reached (30% closed)
- Level broken warning (risk of stop out)
- 3 consecutive failures at level (disable strategy for that level)
- Strategy disabled (kill switch triggered)

## Correlation Rules

### Maximum Exposure
- No more than 3 concurrent S/R bounce positions
- No more than 1 position per asset
- Can run alongside trend strategies (different market phases)
- Total risk across all S/R positions: max 2.5% of capital

## Strategy Versioning

### Current Version: 1.0

### Change Log
- v1.0 (initial): 3+ touches, 30+ days, 2% proximity, RSI thresholds 35/65, 1% stop beyond level

### Future Improvements (Track Performance First)
- Test different level age requirements (20 days, 45 days)
- Test different touch requirements (2, 4, 5+ touches)
- Test different proximity thresholds (1.5%, 3%)
- Add order flow analysis (bid/ask imbalances at levels)
- Test with volume-weighted S/R (not just price touches)
- Incorporate market maker zones (institutional order blocks)

### Modification Rules
Never modify this version. If changes needed, create ST-005 v1.1 and run both in parallel for comparison.

## Real-World Example

### Scenario: BTC Support Bounce at $60k
```
Date: 2024-07-10
Background: BTC established support at $60k over 45 days with 5 touches
Current: BTC approaching $60k again from $62.5k

Support Analysis:
- Level: $60,000 (round number)
- Touches: 5 times over 45 days
- Volume profile: High volume node at $59.8k-$60.2k
- 200 EMA on 1D: $59,500 (nearby confluence)
- Fibonacci 0.618 retracement: $60,100 (confluence)

Entry Signal:
- Date: 2024-07-12, 08:00 UTC
- Price drops to $60,150 (within 2% of support)
- 4H bullish hammer candle forms at $60,100
- RSI(14) on 4H: 32 (oversold)
- Volume declining on approach (no panic)
- Next 4H candle closes at $60,400 (confirmation)
- Entry: $60,400

Stop Loss:
- Support level: $60,000
- Stop: 1% below = $59,400
- Distance: $1,000 (1.65%)

Position Sizing:
- Capital: $10,000
- Risk: $100 (1%)
- Entry: $60,400, Stop: $59,400
- Distance: $1,000
- Position: $100 / $1,000 = 0.1 BTC

Targets (assuming resistance at $64k):
- Range: $60k - $64k = $4,000
- T1 (50% range): $60,000 + $2,000 = $62,000
- T2 (75% range): $60,000 + $3,000 = $63,000
- T3 (99% range): $63,960 (don't aim for exact $64k)

Outcome (example):
- Day 2: T1 hit at $62,000, close 50% for $80 profit
- Day 4: T2 hit at $63,000, close 30% for $78 profit
- Day 5: T3 hit at $63,900, close 20% for $70 profit
- Total: $228 profit on $100 risk = 2.28R
```

### Scenario: Failed Support (Stop Loss)
```
Date: 2024-08-05
Entry: LONG at $61,500 (support at $61k)
Stop: $60,390 (1% below support)

Day 1: Price consolidates at $61,200-$61,600
Day 2: Heavy selling volume, price drops to $60,800
4H candle closes at $60,600 (below support)
Volume: 2.3× average (conviction break)

Stop Loss Hit:
- Exit at: $60,390
- Loss: $100 (1R loss)
- Reason: Support broken with conviction, new lower level forming
- Accept loss and wait for new support to establish
```

## Critical Success Factors

1. Only trade at well-established levels (3+ touches, 30+ days minimum)
2. Require at least 2 confluence factors (don't trade arbitrary levels)
3. Wait for rejection confirmation (candle close away from level)
4. Exit immediately if level breaks with conviction (volume + close beyond)
5. Don't trade the same level more than 3 times if failing (level weakening)
6. Use proper position sizing (1% risk, tight stops just beyond level)

## Strategy Psychology

### Why This Works
- Self-fulfilling prophecy: Traders watch key levels, creating order clusters
- Institutional activity: Large players place orders at significant levels
- Psychological round numbers: Humans gravitate to $60k, $65k, etc.
- Historical memory: Previous support/resistance creates future reactions

### Why This Fails
- Level exhaustion: After many touches, support/resistance weakens
- Regime change: Breakouts end ranges and invalidate levels
- False levels: Not all "support/resistance" is significant
- Whipsaws: Price may spike through level before bouncing (stop hunting)

## Level Quality Assessment

### High-Quality Levels Have:
- [ ] 3+ touches over 30+ days (time-tested)
- [ ] Round number proximity ($60k, $65k, $70k)
- [ ] Previous role reversal (old resistance = new support)
- [ ] Confluence with major EMAs (200 EMA on 1D)
- [ ] High volume profile node (institutional activity)
- [ ] Fibonacci level alignment (0.5, 0.618, 0.382)
- [ ] Multiple timeframe alignment (visible on 1D, 1W)

### Avoid Trading:
- Levels with only 1-2 touches (insufficient validation)
- Levels less than 14 days old (too recent, not established)
- Levels in strong trends (ADX > 35, likely to break)
- Arbitrary levels without confluence (random price points)

## Complementary Strategies

This strategy works well alongside:
- ST-002 (Mean Reversion): Similar regime, different signals (BB vs S/R)
- ST-003 (Breakout): Captures range breakouts when S/R fails
- ST-001 (Trend Following): Different regime (trending vs ranging)

Avoid running alongside:
- Other S/R strategies: Redundant signals
- Counter-range strategies: Conflicting approach

## Advanced Considerations

### Order Book Analysis (Future Enhancement)
- Bid/ask imbalances at key levels
- Large limit orders visible on order book (spoofing risk)
- Market maker activity patterns
- Institutional accumulation/distribution zones

### Volume Profile Deep Dive
- Point of Control (POC): Highest volume price in range
- Value Area High/Low: 70% of volume distribution
- Low Volume Nodes: Potential fast-move zones
- High Volume Nodes: Strong S/R levels

## Common Pitfalls

1. Trading weak levels (only 1-2 touches, recent formation)
2. Ignoring confluence (trading arbitrary levels)
3. Entering before confirmation (price may spike through level)
4. Holding after level breaks (accepting losses is part of strategy)
5. Overtrading same level (if 3 losses, level is dead)

## Final Checklist Before Every Trade

- [ ] Level established (3+ touches, 30+ days)?
- [ ] At least 2 confluence factors present?
- [ ] Price within 2% of level?
- [ ] 1D ADX < 30 (not strong trend)?
- [ ] Rejection candle or pattern confirmed on 4H?
- [ ] RSI supporting entry (< 35 for LONG, > 65 for SHORT)?
- [ ] Volume declining on approach (not breakout volume)?
- [ ] Stop loss 1-2% beyond level?
- [ ] Position sized for 1% risk?
- [ ] No major event within 24 hours?
- [ ] Level not failed 3+ times recently?
- [ ] Strategy not on pause?
