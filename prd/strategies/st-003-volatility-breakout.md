id: ST-003
name: Volatility Breakout
type: Breakout
market_regime: Transition (Low volatility → High volatility)
timeframe: 1D entry, 1W confirmation
holding_period: 3-14 days
complexity: Simple (3 parameters)

## Strategy Hypothesis

After periods of low volatility consolidation, markets tend to break out with significant directional moves. The longer the consolidation (compression), the stronger the subsequent expansion. This strategy captures the initial phase of new trends as they emerge from ranges.

## Market Regime Requirements

### Enable Strategy When
- ATR at 6-month low (volatility compression)
- Price consolidating in narrow range for 14+ days
- Bollinger Bands squeeze (width in bottom 20% of 6-month range)
- Volume declining during consolidation
- No major trend on 1D (ADX < 25)

### Disable Strategy When
- Already in high volatility period (ATR > 120% of 3-month average)
- Major trend already established (ADX > 30)
- Major event scheduled within 48 hours (scheduled volatility)
- 3 consecutive false breakouts

## Entry Rules

### LONG Breakout
1. 1W timeframe: No strong downtrend (price not making new lows)
2. 1D timeframe: ATR in bottom 25% of 6-month range
3. Consolidation: 14+ days of price compression (high-low range < 15%)
4. Breakout trigger: 1D candle closes ABOVE consolidation high
5. Volume confirmation: Breakout volume > 1.5× consolidation average
6. Follow-through: Next 4H candle confirms direction (doesn't immediately reverse)

### SHORT Breakout
1. 1W timeframe: No strong uptrend (price not making new highs)
2. 1D timeframe: ATR in bottom 25% of 6-month range
3. Consolidation: 14+ days of price compression (high-low range < 15%)
4. Breakout trigger: 1D candle closes BELOW consolidation low
5. Volume confirmation: Breakout volume > 1.5× consolidation average
6. Follow-through: Next 4H candle confirms direction (doesn't immediately reverse)

## Risk Management

### Stop Loss Placement
- LONG: Below consolidation low minus ATR × 1.0
- SHORT: Above consolidation high plus ATR × 1.0
- Rationale: If price re-enters range, breakout failed
- Maximum distance: 8% from entry (if wider, skip trade)
- Minimum distance: 3% from entry (if tighter, range too small)

### Take Profit
- Target 1: Width of consolidation × 1.0 (projected move)
- Target 2: Width of consolidation × 2.0 (extended move)
- Target 3: Trailing stop at 20 EMA on 1D (trend continuation)

Example:
```
Consolidation range: $60k - $64k (width: $4k)
Breakout above $64k
T1: $64k + $4k = $68k (50% position)
T2: $64k + $8k = $72k (30% position)
T3: Trail at 1D 20 EMA (20% position)
```

### Position Sizing
```
Risk per trade: 1.5% of capital (slightly higher due to lower frequency)
Position Size = (Capital × 0.015) / Distance to Stop Loss

Example:
Capital: $10,000
Risk: $150 (1.5%)
Entry: $64,000
Stop: $59,500 (7% below)
Distance: $4,500
Position: $150 / $4,500 = 0.0333 BTC
```

## Time Management

### Expected Holding Period
- Minimum: 2 days (allow breakout to develop)
- Typical: 5-10 days
- Maximum: 14 days

### Time Stop
If position hasn't reached Target 1 within 10 days, evaluate:
- If price still above entry + consolidation support holding: keep position
- If price back near entry or below: close position (failed breakout)

## Exit Rules

### Normal Exits
1. Target 1 hit: Close 50%, move stop to breakeven
2. Target 2 hit: Close 30%, trail at 1D 20 EMA
3. Trailing stop hit: Close remaining 20%

### Emergency Exits
1. Price re-enters consolidation range (failed breakout)
2. Volume dries up post-breakout (< 0.7× average for 3 consecutive days)
3. Stop loss hit
4. Major reversal pattern on 1D (engulfing candle back into range)

## Performance Expectations

### Target Metrics
- Win rate: 40-50% (breakouts fail often, but winners are large)
- Average R multiple: 3.0-4.0 (asymmetric payoff)
- Profit factor: > 1.8
- Max drawdown: < 12%

### When to Disable
- Win rate drops below 35% over 15 trades
- Average R multiple drops below 2.0
- 3 consecutive false breakouts
- Max drawdown exceeds 18%

## Backtesting Parameters

### Assets to Test
- BTC/USDT (primary)
- ETH/USDT
- Major altcoins (top 15 by market cap)

### Timeframe
- Minimum: 3 years of data
- Must include multiple consolidation → breakout → trend cycles
- Test across bull, bear, and sideways markets

### Validation
- Out-of-sample testing: 30% of data
- Count false breakout rate separately
- Must achieve 40%+ win rate with 3R+ average winner

## Implementation Notes

### Technical Indicators Required
- ATR(14) on 1D
- ADX(14) on 1D
- Bollinger Bands(20, 2) on 1D for squeeze detection
- EMA(20) on 1D for trailing stop
- Volume MA(20) on 1D
- Historical high/low tracking (14-30 days)

### API Requirements
- 1D candle data
- 4H candle data (for follow-through confirmation)
- Real-time price updates (every 15 minutes sufficient)
- Order placement (limit orders near breakout level)
- Stop loss / take profit orders

### Monitoring Alerts
- Consolidation detected (14+ days, low volatility)
- Breakout imminent (price near range boundary)
- Breakout triggered, waiting for follow-through
- Position opened
- Target 1 reached (50% closed)
- Target 2 reached (30% closed)
- False breakout warning (price re-entering range)
- Strategy disabled (3 false breakouts)

## Correlation Rules

### Maximum Exposure
- No more than 2 concurrent breakout positions
- No more than 1 position per asset
- If BTC breaks out, wait 24h before entering altcoin breakouts (correlation)
- Total risk across all breakout positions: max 3% of capital

## Strategy Versioning

### Current Version: 1.0

### Change Log
- v1.0 (initial): 14-day consolidation, ATR bottom 25%, 1.5× volume confirmation

### Future Improvements (Track Performance First)
- Test different consolidation periods (10 days, 21 days)
- Test different ATR thresholds (bottom 20%, bottom 30%)
- Test different volume multipliers (1.3×, 2.0×)
- Add market structure analysis (higher timeframe support/resistance)
- Test with retest entries (enter on pullback to breakout level)

### Modification Rules
Never modify this version. If changes needed, create ST-003 v1.1 and run both in parallel for comparison.

## Real-World Example

### Scenario: BTC Post-Halving Consolidation Breakout
```
Date: 2024-05-10
Background: BTC consolidated for 18 days between $60k-$64k after halving
ATR(14): $1,200 (bottom 15% of 6-month range)
ADX(14): 18 (no strong trend)
Volume: Declining over 18 days

Breakout Signal:
- Date: 2024-05-28
- Price closes 1D candle at $64,800 (above $64k high)
- Volume: 2.1× consolidation average
- 4H follow-through: Next candle at $65,200 (confirms)

Entry:
- Price: $64,800
- Consolidation width: $4,000 ($64k - $60k)

Stop Loss:
- Consolidation low: $60,000
- ATR: $1,200
- Stop: $60,000 - $1,200 = $58,800
- Distance: 9.2% (acceptable for breakout strategy)

Position Sizing:
- Capital: $10,000
- Risk: $150 (1.5%)
- Entry: $64,800, Stop: $58,800
- Distance: $6,000
- Position: $150 / $6,000 = 0.025 BTC

Targets:
- T1: $64,000 + $4,000 = $68,000
- T2: $64,000 + $8,000 = $72,000
- T3: Trail at 1D 20 EMA

Outcome (example):
- Day 3: T1 hit at $68,000, close 50% for $80 profit
- Day 7: T2 hit at $72,000, close 30% for $108 profit
- Day 12: Trail stop at $70,500, close 20% for $57 profit
- Total: $245 profit on $150 risk = 1.63R

Note: This example shows a modest win. In reality, successful breakouts can deliver 3-5R, while failed breakouts lose 1R quickly.
```

### Scenario: False Breakout (Loss)
```
Date: 2024-06-15
Entry: LONG at $62,500 (breakout above $62k)
Stop: $58,000

Day 1: Price reaches $63,200 (looking good)
Day 2: Volume drops significantly
Day 3: 1D candle closes back at $61,500 (re-entered range)

Emergency Exit:
- Exit at market: $61,500
- Loss: $25 (1R loss)
- Reason: Failed breakout, price back in range
```

## Critical Success Factors

1. Wait for true consolidation (14+ days, low volatility)
2. Confirm breakout with volume (1.5× average minimum)
3. Wait for 4H follow-through (don't chase immediately)
4. Accept that 50-60% of breakouts fail (part of the strategy)
5. Let winners run (don't exit early on T1 or T2)
6. Exit fast if price re-enters range (failed breakout)

## Strategy Psychology

### Why This Works
- Volatility cycles: Compression → Expansion is natural market rhythm
- Trapped traders: Consolidation builds up pending orders on both sides
- Information asymmetry: Breakouts often precede news becoming public
- Technical traders: Many strategies trigger on breakouts (self-fulfilling)

### Why This Fails
- False breakouts: 50-60% of breakouts fail and reverse
- Whipsaw: High volatility can trigger stop before move develops
- News reversals: Breakout on hype, reversal on reality
- Market manipulation: Especially in crypto (low liquidity assets)

## Complementary Strategies

This strategy works well alongside:
- ST-001 (Trend Following): Captures continuation after breakout establishes trend
- ST-002 (Mean Reversion): Different market regime (consolidation vs range)

Avoid running alongside:
- Other breakout strategies: Correlated signals
- Counter-trend strategies: Conflicting with breakout direction

## Advanced Considerations

### Breakout Quality Checklist
High-quality breakouts tend to have:
- [ ] Longer consolidation (21+ days better than 14)
- [ ] Multiple tests of resistance/support during consolidation
- [ ] Volume surge > 2× (not just 1.5×)
- [ ] 4H follow-through within 8 hours
- [ ] No immediate retest of breakout level
- [ ] Alignment with 1W trend direction

### Common Pitfalls
1. Entering too early (before candle close confirmation)
2. Chasing after price already extended (> 5% beyond breakout)
3. Ignoring volume (breakout without volume often fails)
4. Holding failed breakouts (price back in range = exit immediately)
5. Trading low-liquidity altcoins (manipulation risk)

## Final Checklist Before Every Trade

- [ ] Consolidation 14+ days?
- [ ] ATR in bottom 25% of 6-month range?
- [ ] 1D candle closed beyond range boundary?
- [ ] Volume > 1.5× consolidation average?
- [ ] 4H follow-through confirmed (no immediate reversal)?
- [ ] Stop loss 3-8% from entry?
- [ ] Position sized for 1.5% risk?
- [ ] No major event scheduled within 48 hours?
- [ ] Strategy not on pause (no 3 consecutive false breakouts)?
- [ ] No correlated positions already open?
