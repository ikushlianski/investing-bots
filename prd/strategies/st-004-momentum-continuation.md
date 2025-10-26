id: ST-004
name: Momentum Continuation
type: Momentum
market_regime: Strong Trending (ADX > 30)
timeframe: 1H entry, 4H confirmation
holding_period: 12 hours - 3 days
complexity: Simple (4 parameters)

## Strategy Hypothesis

Strong momentum tends to continue in the short term before exhaustion. When price makes impulsive moves with high volume and RSI remains in extreme zones without reverting, the trend likely continues for several more legs. This strategy rides the "middle" of momentum waves, avoiding early entries and late exhaustion phases.

## Market Regime Requirements

### Enable Strategy When
- 4H ADX > 30 (very strong trend)
- Price consistently making higher highs (LONG) or lower lows (SHORT)
- RSI on 4H staying above 60 (LONG) or below 40 (SHORT) for 3+ candles
- Volume consistently above average (1.2× or higher)
- Clear impulsive price action (large candle bodies, small wicks)

### Disable Strategy When
- 4H ADX < 25 (trend weakening)
- RSI divergence appears (price higher but RSI lower, or vice versa)
- Volume declining for 3 consecutive 4H candles
- Parabolic price action (> 15% move in 24 hours = exhaustion risk)
- Major event within 12 hours
- 3 consecutive losses

## Entry Rules

### LONG Momentum
1. 4H timeframe: ADX > 30, price above 20 EMA
2. RSI(14) on 4H: Between 60-80 (strong but not exhausted)
3. Price structure: Making higher highs and higher lows
4. Entry trigger: 1H pullback to 9 EMA, then bullish rejection candle
5. Volume: Pullback on lower volume, rejection candle on higher volume
6. No RSI divergence on 4H or 1D

### SHORT Momentum
1. 4H timeframe: ADX > 30, price below 20 EMA
2. RSI(14) on 4H: Between 20-40 (strong but not exhausted)
3. Price structure: Making lower lows and lower highs
4. Entry trigger: 1H rally to 9 EMA, then bearish rejection candle
5. Volume: Rally on lower volume, rejection candle on higher volume
6. No RSI divergence on 4H or 1D

## Risk Management

### Stop Loss Placement
- LONG: Below recent 1H swing low minus ATR × 1.0
- SHORT: Above recent 1H swing high plus ATR × 1.0
- Maximum distance: 4% from entry
- Minimum distance: 1.5% from entry

### Take Profit
- Target 1: Recent swing extreme (most recent high/low before pullback)
- Target 2: Extension level (1.618 Fibonacci from last swing)
- Target 3: Trailing stop at 9 EMA on 1H (momentum continuation)

### Position Sizing
```
Risk per trade: 1% of capital
Position Size = (Capital × 0.01) / Distance to Stop Loss

Example:
Capital: $10,000
Risk: $100 (1%)
Entry: $65,000 (pullback to 9 EMA)
Stop: $64,000 (1.54%)
Distance: $1,000
Position: $100 / $1,000 = 0.1 BTC
```

## Time Management

### Expected Holding Period
- Minimum: 6 hours (allow momentum wave to develop)
- Typical: 12-36 hours
- Maximum: 3 days

### Time Stop
If position hasn't reached Target 1 within 24 hours, evaluate:
- If ADX still > 30 and structure intact: keep position
- If ADX declining or RSI divergence: close position

## Exit Rules

### Normal Exits
1. Target 1 hit: Close 40%, move stop to breakeven
2. Target 2 hit: Close 40%, trail at 9 EMA on 1H
3. Trailing stop hit: Close remaining 20%

### Emergency Exits
1. RSI divergence appears on 4H (momentum exhaustion warning)
2. ADX drops below 25 (trend weakening)
3. Price closes below 20 EMA on 4H (LONG) or above 20 EMA (SHORT)
4. Volume dries up (< 0.8× average for 2 consecutive 1H candles)
5. Stop loss hit
6. Parabolic move (> 10% in 12 hours = take profit early)

## Performance Expectations

### Target Metrics
- Win rate: 50-60%
- Average R multiple: 2.0-3.0
- Profit factor: > 1.6
- Max drawdown: < 12%

### When to Disable
- Win rate drops below 45% over 20 trades
- Average R multiple drops below 1.5
- 3 consecutive losses
- Max drawdown exceeds 18%

## Backtesting Parameters

### Assets to Test
- BTC/USDT
- ETH/USDT
- High-momentum altcoins (top 20 by volume)

### Timeframe
- Minimum: 2 years of data
- Focus on trending periods (ADX > 30 for extended periods)
- Exclude ranging markets from performance analysis

### Validation
- Out-of-sample testing: 30% of data
- Test performance during bull runs vs bear crashes separately
- Must maintain 50%+ win rate in both directions

## Implementation Notes

### Technical Indicators Required
- EMA(9) on 1H
- EMA(20) on 4H
- ADX(14) on 4H
- RSI(14) on 4H
- ATR(14) on 1H
- Volume MA(20) on 1H

### API Requirements
- 1H candle data
- 4H candle data
- Real-time price updates (every 2-5 minutes)
- Fast order execution (momentum moves quickly)
- Stop loss / take profit orders
- Trailing stop functionality

### Monitoring Alerts
- Momentum setup detected (ADX > 30, RSI in zone)
- Pullback to 9 EMA approaching
- Entry triggered (rejection candle)
- Position opened
- Target 1 reached (40% closed)
- Target 2 reached (40% closed)
- RSI divergence warning (exit condition)
- ADX declining below 25 (trend weakening)
- Strategy disabled (kill switch triggered)

## Correlation Rules

### Maximum Exposure
- No more than 2 concurrent momentum positions
- No more than 1 position per asset
- If BTC in strong momentum, limit altcoin positions to 1 (high correlation)
- Total risk across all momentum positions: max 2% of capital

## Strategy Versioning

### Current Version: 1.0

### Change Log
- v1.0 (initial): 9 EMA pullback, ADX > 30, RSI 60-80 / 20-40, 3-day max hold

### Future Improvements (Track Performance First)
- Test different EMA periods (8, 10, 12)
- Test different ADX thresholds (28, 32, 35)
- Test different RSI zones (55-75, 65-85 for LONG)
- Add higher timeframe momentum filter (1D ADX)
- Test with multiple EMA pullback entries (9, 20, 50 EMA)

### Modification Rules
Never modify this version. If changes needed, create ST-004 v1.1 and run both in parallel for comparison.

## Real-World Example

### Scenario: BTC Bull Run Momentum Continuation
```
Date: 2024-11-08
Background: BTC in strong uptrend, rallying from $68k to $75k over 5 days
4H ADX: 38 (very strong trend)
4H RSI: 68 (strong momentum, not exhausted)
4H EMA(20): $72,000

Price Action:
- BTC pulls back from $75,200 to $73,500 on 1H
- 1H price touches 9 EMA at $73,500
- 1H bullish rejection candle closes at $74,000
- Volume on rejection: 1.4× average

Entry Signal:
- 4H trend confirmed (ADX 38, price above 20 EMA)
- RSI in momentum zone (68, between 60-80)
- 1H pullback to 9 EMA complete
- Bullish rejection with volume
- Entry: $74,000

Stop Loss:
- 1H swing low during pullback: $73,200
- ATR(14) on 1H: $600
- Stop: $73,200 - $600 = $72,600
- Distance: 1.89%

Position Sizing:
- Capital: $10,000
- Risk: $100 (1%)
- Entry: $74,000, Stop: $72,600
- Distance: $1,400
- Position: $100 / $1,400 = 0.0714 BTC

Targets:
- T1 (recent high): $75,200 (40% position)
- T2 (extension): $76,800 (40% position)
- T3: Trail at 9 EMA on 1H (20%)

Outcome (example):
- 8 hours: T1 hit at $75,200, close 40% for $34 profit
- 18 hours: T2 hit at $76,800, close 40% for $80 profit
- 30 hours: Trail stop at $76,000, close 20% for $57 profit
- Total: $171 profit on $100 risk = 1.71R
```

### Scenario: Failed Momentum (Early Exit)
```
Date: 2024-11-22
Entry: SHORT at $64,500 (bear momentum, ADX 34, RSI 35)
Stop: $65,200

Hour 6: Price drops to $63,800 (looking good)
Hour 10: RSI divergence appears (price at $63,500 but RSI at 38, higher than before)
Hour 12: ADX drops to 27 (momentum weakening)

Emergency Exit:
- Exit at market: $63,600
- Profit: $64 on $100 risk = 0.64R
- Reason: RSI divergence + ADX declining (momentum exhaustion signs)
- Better to exit with small profit than risk reversal
```

## Critical Success Factors

1. Only trade during very strong trends (ADX > 30)
2. Enter on pullbacks to 9 EMA, not on breakouts
3. Confirm rejection with volume surge
4. Watch for RSI divergence constantly (early exit signal)
5. Exit quickly if ADX starts declining
6. Don't hold beyond 3 days (momentum strategies are short-term)

## Strategy Psychology

### Why This Works
- Momentum persistence: Trends continue until exhaustion
- Emotional trading: FOMO and panic drive extended moves
- Algorithmic amplification: Trend-following bots add fuel
- Pullbacks to fast EMA: Natural pause points before next leg

### Why This Fails
- Momentum exhaustion: All trends eventually end
- RSI divergence: Momentum weakening before price reverses
- Volume decline: Participation drying up
- Parabolic moves: Unsustainable climax runs

## Complementary Strategies

This strategy works well alongside:
- ST-001 (Trend Following): Different timeframes, can run concurrently
- ST-003 (Breakout): Captures early momentum, this captures continuation

Avoid running alongside:
- ST-002 (Mean Reversion): Opposite market regime
- Counter-trend strategies: Direct conflict

## Advanced Considerations

### Momentum Quality Signals
High-quality momentum tends to have:
- [ ] ADX > 35 (not just > 30)
- [ ] RSI stays in zone for 5+ candles (not oscillating)
- [ ] Volume consistently elevated (> 1.2× for entire move)
- [ ] Clean price structure (no overlapping candles, clear direction)
- [ ] 1D timeframe aligned (same direction trend)

### Common Pitfalls
1. Entering too late (RSI already > 80 or < 20 = exhaustion)
2. Ignoring RSI divergence (strongest reversal signal)
3. Holding too long (momentum is fast, don't turn into swing trade)
4. Trading weak momentum (ADX 25-28 instead of > 30)
5. Chasing without pullback (entering at highs/lows)

## Momentum vs Trend Following

This strategy differs from ST-001:
- **Timeframe:** 1H vs 4H (faster)
- **Holding:** 12-36 hours vs 1-5 days (shorter)
- **Entry:** Pullback to 9 EMA vs 20 EMA (shallower)
- **ADX:** > 30 vs > 25 (stronger trend requirement)
- **RSI:** Active filter vs not used (momentum-specific)

Both can run simultaneously on different timeframes without conflict.

## Final Checklist Before Every Trade

- [ ] 4H ADX > 30?
- [ ] RSI in momentum zone (60-80 for LONG, 20-40 for SHORT)?
- [ ] No RSI divergence on 4H or 1D?
- [ ] 1H pullback to 9 EMA complete?
- [ ] Rejection candle with volume confirmation?
- [ ] Stop loss within 1.5-4% range?
- [ ] Position sized for 1% risk?
- [ ] No parabolic move in progress (< 15% in 24h)?
- [ ] Strategy not on pause (no 3 consecutive losses)?
- [ ] No major event within 12 hours?
