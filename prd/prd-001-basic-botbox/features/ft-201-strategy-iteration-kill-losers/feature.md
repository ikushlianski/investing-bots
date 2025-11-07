title: FT-201 Strategy Iteration & Kill Losers
feature-id: ft-201
status: planned
priority: P0
phase: Months 4-6 (Iteration + Kill losers)

## Overview

Systematically evaluate testnet strategies, kill underperformers, and iterate on survivors. This phase separates signal from noise and focuses resources on strategies with proven edge.

## Problem Statement

After 90 days of testnet trading, you have performance data but need a disciplined process to act on it. Without clear kill criteria and iteration methodology, you risk:
- Keeping losing strategies alive out of emotional attachment
- Abandoning winners too early due to normal drawdowns
- Missing opportunities to improve marginal strategies
- Wasting time monitoring dead strategies

Expect reality: Only 2-3 strategies from initial 7 will be profitable. This is normal. The goal is to find and focus on winners.

## Goals

Kill strategies that fail objective criteria:
- Sharpe ratio <0.5 after 60+ trades
- Max drawdown >30%
- Negative expectancy after 90 days

Iterate on survivors:
- Optimize parameters that show promise
- Test variations (different timeframes, assets, filters)
- Scale virtual capital for winners

Focus resources on 2-3 proven performers.

## Success Metrics

- Kill 3-5 underperforming strategies by Month 6
- 2-3 survivors show consistent profitability (Sharpe >0.8)
- Survivors tested across different market regimes (trending, ranging, volatile)
- Parameter optimization improves Sharpe by 15%+ on survivors
- Clear documentation of why strategies were killed (learning for future)

## Kill Criteria

### Hard Kill Thresholds (Automatic Shutdown)

After minimum 60 trades or 90 days, kill if ANY of:
- Sharpe ratio <0.5
- Max drawdown >30%
- Win rate <35%
- Profit factor <1.2
- 10+ consecutive losses

### Soft Kill Indicators (Manual Review Required)

Flag for review if:
- Sharpe ratio 0.5-0.8 (marginal)
- Max drawdown 20-30%
- Performance deteriorating over time
- High correlation with a better-performing strategy (redundant)
- Only profitable in one specific market regime

## Iteration Methodology

For surviving strategies, test variations:

### Parameter Optimization
- Timeframe: Test 1H, 4H, 1D versions
- Stop-loss: Test tighter/wider stops (±50%)
- Position size: Test smaller/larger (±30%)
- Entry thresholds: Adjust indicator levels (e.g., RSI 25 vs 30)

### Asset Pool Expansion
- If BTC/ETH works, test top 10 coins
- If top-5 works, expand to top 20 (carefully)

### Filter Addition
- Add regime filter: Only trade in favorable conditions
- Add volatility filter: Pause during extreme volatility
- Add correlation filter: Avoid correlated positions

### Risk Adjustment
- Test more conservative stops
- Test pyramiding vs fixed position size
- Test scaling in/out vs all-in/all-out

## Iteration Testing Process

1. Identify best performer from Phase 1
2. Create 5 variations with single parameter changes
3. Backtest each variation over same historical period
4. Deploy top 2 variations on testnet alongside original
5. Run for 30 days
6. Compare performance, kill losers, promote winner
7. Repeat for next best strategy

## User Stories

### US-001: Strategy Performance Review Dashboard
As a trader, I want a detailed review dashboard showing kill criteria metrics, so I can objectively decide which strategies to eliminate.

Acceptance Criteria:
- Table view of all strategies with kill criteria highlighted
- Red/yellow/green indicators for each threshold
- Recommendation: "Kill", "Review", "Keep"
- Historical performance charts (equity curve, drawdown)
- Trade-by-trade breakdown available

### US-002: Kill Strategy with One Click
As a trader, I want to deactivate underperforming strategies and archive their data, so I can focus on winners without losing historical learnings.

Acceptance Criteria:
- "Kill Strategy" button on strategy page
- Confirmation dialog with kill reason dropdown
- Strategy marked as "Archived" not "Deleted"
- All historical data preserved for analysis
- Post-mortem report generated: "Why this failed"

### US-003: Create Strategy Variations
As a trader, I want to clone a strategy and modify parameters, so I can test improvements without affecting the original.

Acceptance Criteria:
- "Clone Strategy" button creates copy with "-v2" suffix
- Change one parameter (e.g., stop-loss 2% → 3%)
- Deploy variation on testnet
- Side-by-side comparison view: original vs variation
- Clear lineage tracking: "Variation of ST-003 v1.0"

### US-004: A/B Test Strategy Versions
As a trader, I want to run original and variation simultaneously with equal capital, so I can fairly compare performance.

Acceptance Criteria:
- Run ST-003 v1.0 and ST-003 v1.1 side-by-side
- Allocate same virtual capital to each
- Track performance independently
- After 30 days, show winner
- Option to kill loser and reallocate capital to winner

## Technical Requirements

### Kill Decision Engine

```typescript
interface KillCriteria {
  minTrades: number
  minDays: number
  thresholds: {
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitFactor: number
    consecutiveLosses: number
  }
}

interface StrategyEvaluation {
  strategyId: string
  tradeCount: number
  daysLive: number
  metrics: {
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitFactor: number
    consecutiveLosses: number
  }
  recommendation: 'kill' | 'review' | 'keep'
  reasons: string[]
}

function evaluateStrategy(strategy: Strategy): StrategyEvaluation {
  const metrics = calculateMetrics(strategy)

  if (metrics.sharpeRatio < 0.5) {
    return { recommendation: 'kill', reasons: ['Sharpe ratio too low'] }
  }

  if (metrics.maxDrawdown > 0.30) {
    return { recommendation: 'kill', reasons: ['Max drawdown exceeded 30%'] }
  }

  // Additional checks...

  return { recommendation: 'keep', reasons: ['All criteria passed'] }
}
```

### Variation Tracking Schema

```typescript
interface StrategyVariation {
  id: string
  parentStrategyId: string
  versionNumber: number
  changedParameters: {
    parameterName: string
    oldValue: any
    newValue: any
  }[]
  hypothesis: string
  createdAt: Date
  testedFrom: Date
  testedUntil: Date
  result: 'better' | 'worse' | 'inconclusive'
  promotedToProduction: boolean
}
```

### Post-Mortem Report Generator

When killing a strategy, auto-generate report:
```markdown
# Strategy Post-Mortem: ST-002 Support/Resistance Bounce

## Performance Summary
- Total Trades: 47
- Win Rate: 38%
- Sharpe Ratio: 0.3
- Max Drawdown: 22%
- Total P&L: -$420

## Why It Failed
- Win rate too low (<40% threshold)
- Sharpe ratio below minimum (0.5)
- Support/resistance levels not reliable in trending markets

## What We Learned
- Simple S/R levels need volume confirmation
- Strategy only worked in ranging markets (45% of time)
- Better performance on BTC than ETH (BTC: 42% WR, ETH: 34% WR)

## Salvage Opportunities
- Add market regime filter (only trade in ranging markets)
- Improve S/R detection algorithm
- Consider as entry signal for another strategy, not standalone

## Archived: 2025-06-15
```

## Iteration Workflow

### Week 1-2: Evaluation
- Run kill criteria on all strategies
- Generate performance reports
- Hold review meeting
- Decide: kill, keep, or iterate

### Week 3-4: Create Variations
- Clone top 3 performers
- Modify one parameter per variation
- Document hypothesis for each change

### Week 5-8: Test Variations
- Deploy variations on testnet
- Run alongside originals
- Collect 30 days minimum data

### Week 9-10: Promote Winners
- Compare original vs variations
- Kill underperformers
- Promote best variation to "production" status
- Reallocate capital from killed strategies

## Dependencies

- FT-200: Initial Strategy Library (provides strategies to evaluate)
- FT-113: Strategy Performance Analytics (provides metrics)
- FT-120: Strategy Validation Suite (backtesting for variations)
- FT-145: Strategy Versioning & A/B Testing (tracks variations)

## Testing Strategy

Critical tests:
1. Strategy meets kill criteria → verify flagged for shutdown
2. Create variation with different stop-loss → verify tracked as separate entity
3. Run A/B test: original vs variation → verify fair capital allocation
4. Kill strategy → verify data archived not deleted
5. Generate post-mortem → verify all sections populated correctly

## Expected Outcomes

Based on typical strategy development success rates:

| Initial Strategies | Survived Month 6 | Kill Reason Distribution |
|--------------------|------------------|--------------------------|
| 7                  | 2-3              | 40% Sharpe too low       |
|                    |                  | 30% Max drawdown         |
|                    |                  | 20% Redundant            |
|                    |                  | 10% Market regime change |

## Open Questions

1. Should we kill strategies that only work in one regime?
   - No, keep them but pause during unfavorable regimes (use FT-140 Market Regime Detection)

2. How many variations should we test per strategy?
   - Max 3 variations per strategy at a time (avoid over-optimization)

3. What if all strategies fail?
   - Back to research phase. Possible causes: market regime changed, strategies need regime filters, backtests didn't include realistic slippage

4. Should we revive killed strategies if market regime changes?
   - Yes, archive not delete. If regime returns, re-test with fresh eyes

## Success Criteria

Feature is successful if:
- Clear kill decisions made on 3-5 strategies
- 2-3 survivors show improved performance after iteration
- Post-mortem reports provide actionable learnings
- Iteration process improves Sharpe ratio by 15%+
- Capital reallocated efficiently from losers to winners
- Team has confidence in surviving strategies for next phase (scaling)

## Next Phase

After killing losers and iterating on survivors, proceed to ft-202-focus-on-survivors to scale virtual capital and optimize risk management.
