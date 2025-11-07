title: FT-200 Initial Strategy Library (5-7 Testnet Strategies)
feature-id: ft-200
status: planned
priority: P0
phase: Months 1-3 (Development + Infrastructure)

## Overview

Launch 5-7 diverse trading strategies on testnet with virtual capital allocation to validate the strategy framework and begin collecting performance data across different market conditions.

## Problem Statement

Running a single strategy provides no diversification and limited learning. The testnet phase needs multiple strategies with different risk profiles to discover what actually works and build confidence in the framework before risking real capital.

Without a diversified strategy portfolio from day one, you cannot answer critical questions:
- Which strategy types perform best in current market conditions?
- How do strategies correlate during drawdowns?
- What's the realistic performance range to expect?
- Which strategies should be killed vs scaled?

## Goals

Deploy 5-7 strategies across risk profiles:
- Conservative (30%): Mean reversion on top-5 coins, support/resistance bounce
- Moderate (40%): Trend following, breakout strategies, volatility expansion
- Aggressive (30%): Funding rate arbitrage, low-cap altcoins momentum, high frequency

Allocate virtual capital: $5-10k per strategy for realistic testing.

Track performance for 90 days to identify survivors.

## Success Metrics

- 5-7 strategies live on testnet within 30 days
- Each strategy executes minimum 10 trades in first month
- Virtual capital tracked accurately per strategy
- Performance data collected: win rate, Sharpe ratio, max drawdown
- At least 2-3 strategies show positive expectancy after 90 days

## Required Strategies

### Conservative Strategies (30% of testnet capital)

**ST-001: Mean Reversion Top-5 Coins**
- Asset pool: BTC, ETH, BNB, SOL, ADA
- Entry: RSI <30 + Bollinger Band lower touch
- Exit: RSI >70 or 3% profit or -2% stop
- Timeframe: 4H
- Virtual allocation: $7k

**ST-002: Support/Resistance Bounce**
- Asset pool: BTC, ETH
- Entry: Price bounces off daily support level with volume confirmation
- Exit: Price reaches resistance or -1.5% stop
- Timeframe: 1H
- Virtual allocation: $8k

### Moderate Strategies (40% of testnet capital)

**ST-003: Trend Following**
- Asset pool: BTC, ETH, SOL
- Entry: Price above 50-day MA + ADX >25 + Higher high
- Exit: Price below 20-day MA or -3% stop
- Timeframe: 4H
- Virtual allocation: $10k

**ST-004: Breakout Strategy**
- Asset pool: Top 20 coins by volume
- Entry: Price breaks above 20-day high with volume >2x average
- Exit: Trailing stop 2x ATR or -2% hard stop
- Timeframe: 1H
- Virtual allocation: $8k

**ST-005: Volatility Expansion**
- Asset pool: BTC, ETH
- Entry: Bollinger Band squeeze (width <0.02) followed by expansion
- Exit: Bollinger Band returns to normal width or -2.5% stop
- Timeframe: 1H
- Virtual allocation: $7k

### Aggressive Strategies (30% of testnet capital)

**ST-006: Funding Rate Arbitrage**
- Asset pool: BTC, ETH perpetual futures
- Entry: Funding rate >0.1% + spot-futures spread >0.5%
- Exit: Spread normalizes or -1% stop
- Timeframe: Real-time (check every 8h)
- Virtual allocation: $10k

**ST-007: Low-Cap Momentum**
- Asset pool: Coins ranked 50-100 by market cap, high volume
- Entry: 4H candle closes with +8% gain + volume >3x average
- Exit: 2-hour reversal or -5% stop
- Timeframe: 4H
- Virtual allocation: $5k

## Virtual Capital Allocation

Total testnet capital: $50k virtual

| Strategy Type | Count | Per Strategy | Total |
|---------------|-------|--------------|-------|
| Conservative  | 2     | $7-8k        | $15k  |
| Moderate      | 3     | $7-10k       | $25k  |
| Aggressive    | 2     | $5-10k       | $15k  |

## Technical Requirements

### Strategy Configuration Schema
```typescript
interface StrategyConfig {
  id: string
  name: string
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  virtualCapital: number
  assetPool: string[]
  entryRules: Rule[]
  exitRules: Rule[]
  timeframe: string
  maxPositions: number
  positionSizePercent: number
  stopLossPercent: number
}
```

### Performance Tracking Per Strategy
Track independently:
- Total P&L
- Win rate
- Avg win vs avg loss
- Max drawdown
- Sharpe ratio
- Number of trades
- Correlation with other strategies

### Kill Criteria
Automatically flag for review if:
- Sharpe ratio <0.5 after 30 trades
- Max drawdown >30%
- Losing streak >7 consecutive trades
- Win rate <35% after 20 trades

## User Stories

### US-001: Configure and Deploy Initial Strategies
As a trader, I want to configure 5-7 strategies with different parameters and deploy them on testnet, so I can test multiple approaches simultaneously.

Acceptance Criteria:
- UI for creating strategy configurations
- Assign virtual capital per strategy
- Deploy to testnet with one click
- Verify each strategy is placing orders correctly

### US-002: Monitor Strategy Performance Dashboard
As a trader, I want a dashboard showing all testnet strategies side-by-side, so I can quickly compare performance.

Acceptance Criteria:
- Grid view of all strategies with key metrics
- Color-coded performance indicators (green/yellow/red)
- Sort by P&L, Sharpe ratio, max drawdown
- Filter by risk profile
- Click strategy to see detailed trade history

### US-003: Track Virtual Capital Allocation
As a trader, I want accurate tracking of virtual capital per strategy, so I can measure true ROI.

Acceptance Criteria:
- Each strategy shows allocated capital
- P&L calculated as percentage of allocated capital
- ROI metric: (current_value - initial_capital) / initial_capital
- Can reallocate capital to winning strategies

## Dependencies

- FT-060: Paper Trading & Testnet Mode (required for testnet execution)
- FT-090: Strategy Creation Framework (required for strategy definitions)
- FT-113: Strategy Performance Analytics (required for tracking)
- FT-065: Test Strategy Implementation (provides initial strategy example)

## Testing Strategy

Critical tests:
1. Deploy all 7 strategies → verify each places test orders
2. Simulate 30 days of price data → verify all strategies execute correctly
3. Check virtual capital allocation → verify no strategy exceeds allocated amount
4. Force a losing streak → verify kill criteria flags strategy
5. Test strategy correlation calculation → verify diversification metrics

## Open Questions

1. Should aggressive strategies get smaller capital allocation initially?
   - Yes, start conservative: $5k for aggressive, $10k for conservative

2. How often should kill criteria be evaluated?
   - Weekly review, but only kill after minimum 20 trades

3. Should funding rate arbitrage be included in Phase 1?
   - Yes, but only on testnet. Requires perpetual futures API integration.

4. What's minimum trades before meaningful performance assessment?
   - 20 trades minimum, prefer 30+ for statistical significance

## Success Criteria

Feature is successful if:
- 5-7 strategies deployed within 30 days
- Each strategy executes minimum 10 trades in first month
- 2-3 strategies show positive Sharpe ratio after 90 days
- Performance tracking accurate (backtest vs live <20% divergence)
- Kill criteria successfully identifies 2-3 underperformers by Month 4
- Dashboard enables easy comparison and decision-making

## Next Phase

After 90 days, proceed to ft-201-strategy-iteration-kill-losers to eliminate underperformers and scale winners.
