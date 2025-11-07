title: FT-202 Focus on Survivors & Scale Testing
feature-id: ft-202
status: planned
priority: P0
phase: Months 7-9 (Focus on survivors)

## Overview

Scale virtual capital for proven strategies, optimize risk management at portfolio level, and test performance across different market conditions. This phase transforms validated ideas into production-ready systems.

## Problem Statement

You have 2-3 strategies that survived the kill phase with positive Sharpe ratios. Now the critical question: can they maintain performance when scaled?

Challenges when scaling:
- Larger position sizes may face slippage
- Portfolio-level correlation risk emerges
- Risk management needs coordination across strategies
- Market conditions change, regimes shift
- Overconfidence from small-sample success

Without rigorous scale testing and portfolio-level risk controls, you risk blowing up when transitioning to real money.

## Goals

Scale survivors from $5-10k to $10-15k virtual capital each.

Implement portfolio-level risk management:
- Max total drawdown limits
- Correlation monitoring between strategies
- Position sizing coordination

Test strategies across market regimes:
- Trending markets (bull/bear)
- Ranging/choppy markets
- High volatility events
- Low volatility periods

Optimize risk-adjusted returns using portfolio theory.

## Success Metrics

- Survivors maintain Sharpe >0.8 at 2x capital
- Portfolio max drawdown stays <20%
- Strategies show low correlation (<0.5)
- Each strategy tested in minimum 3 different market regimes
- Risk-adjusted portfolio return beats individual strategies
- Monitoring catches and prevents >90% of dangerous situations

## Core Components

### A. Capital Scaling Plan

Gradual increase, not immediate 2x:
- Month 7: Increase to 125% of original
- Month 8: Increase to 150% of original
- Month 9: Increase to 200% of original

Monitor at each step:
- Does Sharpe ratio deteriorate?
- Is slippage becoming a problem?
- Are fill rates still acceptable?

If any metric degrades >15%, halt scaling and investigate.

### B. Portfolio-Level Risk Management

Implement circuit breakers:
- Total portfolio drawdown >15%: halt all new trades
- Total portfolio drawdown >20%: close all positions
- Single day loss >5%: reduce all position sizes by 50%

Correlation monitoring:
- Track pairwise correlation between all strategies
- Alert if correlation >0.7 (too similar, concentrated risk)
- Ideally maintain correlation <0.5 (diversification)

Position coordination:
- If Strategy A and B both want to long BTC, limit total BTC exposure
- Max exposure to single asset: 40% of portfolio
- Max number of simultaneous positions: 8 across all strategies

### C. Market Regime Testing

Categorize historical performance by regime:

**Trending Bull:**
- Which strategies performed best?
- Which should be paused?

**Trending Bear:**
- Do mean reversion strategies get crushed?
- Do trend followers profit?

**Ranging/Choppy:**
- Do breakout strategies fail?
- Do mean reversion strategies thrive?

**High Volatility (VIX equivalent >80th percentile):**
- Do strategies hit stops too frequently?
- Should position sizes reduce?

**Low Volatility (VIX equivalent <20th percentile):**
- Do strategies struggle to find entries?
- Should filters relax?

For each strategy, document optimal regimes and create auto-pause rules.

### D. Risk-Adjusted Optimization

Treat 2-3 strategies as portfolio, optimize allocation:
- Not equal weight (33/33/33)
- Weight by Sharpe ratio
- Weight by max drawdown (inverse)
- Use Mean-Variance Optimization or Kelly Criterion

Example:
```
Strategy A: Sharpe 1.2, Max DD 12%
Strategy B: Sharpe 0.9, Max DD 18%
Strategy C: Sharpe 1.4, Max DD 8%

Optimal allocation (simplified):
A: 35%
B: 25%
C: 40%

Not equal weight, but risk-adjusted.
```

## User Stories

### US-001: Gradual Capital Scaling Dashboard
As a trader, I want to scale capital gradually and see if performance degrades, so I can catch scaling issues early.

Acceptance Criteria:
- UI to set capital scaling schedule (125% → 150% → 200%)
- At each step, compare metrics vs baseline:
  - Sharpe ratio change
  - Slippage estimate
  - Fill rate
  - Max drawdown
- Alert if any metric degrades >15%
- Rollback to previous capital level if degradation detected

### US-002: Portfolio Correlation Heatmap
As a trader, I want to see correlation between strategies, so I can ensure diversification.

Acceptance Criteria:
- Heatmap showing pairwise correlation (2-3 strategies)
- Daily update based on last 30 days returns
- Alert if correlation >0.7 between any pair
- Recommendation: "Reduce allocation to correlated strategies"
- Export correlation data for analysis

### US-003: Portfolio-Level Circuit Breakers
As a trader, I want automatic shutdown if portfolio drawdown exceeds limits, so I don't blow up the account.

Acceptance Criteria:
- Configure thresholds:
  - 15% drawdown: halt new trades
  - 20% drawdown: close all positions
  - 5% single day loss: reduce position sizes 50%
- Test circuit breaker logic (simulate drawdown)
- Alert when threshold approached (e.g., at 12% drawdown)
- Manual override option (with confirmation)
- Logging: all circuit breaker triggers recorded

### US-004: Regime Performance Breakdown
As a trader, I want to see how each strategy performs in different market regimes, so I can pause them during unfavorable conditions.

Acceptance Criteria:
- Classify historical trades by market regime
- Show per-strategy metrics by regime:
  - "Strategy A: Trending Bull: +12%, Sharpe 1.5"
  - "Strategy A: Ranging: +3%, Sharpe 0.6"
- Recommendation: "Pause Strategy A in ranging markets"
- Integration with FT-140 Market Regime Detection for auto-pause

### US-005: Portfolio Allocation Optimizer
As a trader, I want to optimize capital allocation based on risk-adjusted returns, so I maximize portfolio Sharpe ratio.

Acceptance Criteria:
- Input: 2-3 strategies with historical metrics
- Calculate optimal allocation using Mean-Variance Optimization
- Show comparison:
  - Equal weight allocation
  - Risk-adjusted allocation
  - Expected improvement in Sharpe ratio
- Apply allocation with one click
- Rerun optimization monthly

## Technical Requirements

### Capital Scaling Logic

```typescript
interface CapitalScalingPlan {
  strategyId: string
  baseCapital: number
  targetCapital: number
  steps: ScalingStep[]
  currentStep: number
  status: 'active' | 'paused' | 'rolled_back'
}

interface ScalingStep {
  stepNumber: number
  capitalMultiplier: number  // 1.25, 1.5, 2.0
  scheduledDate: Date
  executedDate?: Date
  metrics: {
    sharpeRatio: number
    slippagePercent: number
    fillRate: number
    maxDrawdown: number
  }
  metricsVsBaseline: {
    sharpeDelta: number
    slippageDelta: number
    fillRateDelta: number
    maxDrawdownDelta: number
  }
  passed: boolean
  failureReason?: string
}

function executeScalingStep(plan: CapitalScalingPlan): void {
  const step = plan.steps[plan.currentStep]

  // Scale capital
  const newCapital = plan.baseCapital * step.capitalMultiplier

  // Monitor for 7 days
  const metrics = collectMetrics(plan.strategyId, 7)

  // Compare to baseline
  const baseline = getBaselineMetrics(plan.strategyId)
  const delta = calculateDelta(metrics, baseline)

  if (delta.sharpeDelta < -0.15 || delta.maxDrawdownDelta > 0.15) {
    rollbackCapital(plan.strategyId, plan.baseCapital)
    plan.status = 'rolled_back'
    alert(`Scaling failed for ${plan.strategyId}, rolled back`)
  } else {
    plan.currentStep++
    plan.status = 'active'
  }
}
```

### Portfolio Risk Manager

```typescript
interface PortfolioRiskLimits {
  maxDrawdownPercent: number
  criticalDrawdownPercent: number
  maxSingleDayLossPercent: number
  maxAssetExposurePercent: number
  maxOpenPositions: number
}

interface PortfolioState {
  totalEquity: number
  peakEquity: number
  currentDrawdown: number
  todayPnL: number
  openPositions: Position[]
  assetExposure: Record<string, number>
}

class PortfolioRiskManager {
  checkCircuitBreakers(state: PortfolioState, limits: PortfolioRiskLimits): Action {
    if (state.currentDrawdown > limits.criticalDrawdownPercent) {
      return { type: 'CLOSE_ALL_POSITIONS', reason: 'Critical drawdown exceeded' }
    }

    if (state.currentDrawdown > limits.maxDrawdownPercent) {
      return { type: 'HALT_NEW_TRADES', reason: 'Max drawdown exceeded' }
    }

    if (state.todayPnL / state.totalEquity < -limits.maxSingleDayLossPercent) {
      return { type: 'REDUCE_POSITION_SIZES', percent: 50, reason: 'Single day loss limit' }
    }

    return { type: 'CONTINUE', reason: 'All checks passed' }
  }

  checkAssetConcentration(state: PortfolioState, limits: PortfolioRiskLimits): boolean {
    for (const [asset, exposure] of Object.entries(state.assetExposure)) {
      if (exposure / state.totalEquity > limits.maxAssetExposurePercent) {
        alert(`Asset concentration risk: ${asset} at ${exposure}%`)
        return false
      }
    }
    return true
  }
}
```

### Correlation Calculator

```typescript
interface StrategyReturns {
  strategyId: string
  dailyReturns: number[]
}

function calculateCorrelationMatrix(strategies: StrategyReturns[]): number[][] {
  const n = strategies.length
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = calculatePearsonCorrelation(
        strategies[i].dailyReturns,
        strategies[j].dailyReturns
      )
    }
  }

  return matrix
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0)
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0)
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))

  return numerator / denominator
}
```

### Regime Classifier Integration

```typescript
enum MarketRegime {
  TrendingBull = 'trending_bull',
  TrendingBear = 'trending_bear',
  Ranging = 'ranging',
  HighVolatility = 'high_volatility',
  LowVolatility = 'low_volatility',
}

interface StrategyRegimePerformance {
  strategyId: string
  regime: MarketRegime
  tradeCount: number
  winRate: number
  sharpeRatio: number
  avgReturn: number
  maxDrawdown: number
  recommendation: 'optimal' | 'acceptable' | 'avoid'
}

function analyzeRegimePerformance(
  strategyId: string,
  trades: Trade[]
): StrategyRegimePerformance[] {
  const tradesByRegime = groupTradesByRegime(trades)

  return Object.entries(tradesByRegime).map(([regime, trades]) => {
    const metrics = calculateMetrics(trades)

    let recommendation: 'optimal' | 'acceptable' | 'avoid'
    if (metrics.sharpeRatio > 1.0) {
      recommendation = 'optimal'
    } else if (metrics.sharpeRatio > 0.5) {
      recommendation = 'acceptable'
    } else {
      recommendation = 'avoid'
    }

    return {
      strategyId,
      regime: regime as MarketRegime,
      ...metrics,
      recommendation,
    }
  })
}
```

## Dependencies

- FT-201: Strategy Iteration & Kill Losers (provides surviving strategies)
- FT-091: Risk Management Framework (portfolio-level controls)
- FT-140: Market Regime Detection (regime classification)
- FT-113: Strategy Performance Analytics (metrics calculation)
- FT-112: Portfolio Analytics (portfolio-level view)

## Testing Strategy

Critical tests:
1. Scale capital 2x → verify no performance degradation
2. Simulate 20% drawdown → verify circuit breaker closes positions
3. Run 2 correlated strategies → verify correlation alert triggers
4. Force BTC exposure >40% → verify position rejected
5. Test in different regimes → verify regime-specific performance tracked

Stress tests:
- Flash crash scenario: -30% in 1 hour
- All strategies losing simultaneously
- API failure during high drawdown
- Correlation spike during market crash

## Expected Outcomes

By end of Month 9:
- 2-3 strategies scaled to $10-15k each
- Portfolio Sharpe ratio >1.0
- Max portfolio drawdown <15%
- Strategy correlation <0.5
- All strategies tested across 3+ regimes
- Clear documentation of optimal conditions per strategy

## Open Questions

1. Should we allow manual override of circuit breakers?
   - Yes, but require written justification and multi-click confirmation

2. How to handle regime transitions (e.g., trending → ranging)?
   - Don't pause mid-position. Let current trades close, then pause new entries.

3. What if all strategies prefer the same regime?
   - Red flag: lack of diversification. Need to develop strategies for other regimes in future phases.

4. Should capital scaling be automatic or manual approval per step?
   - Manual approval recommended. Automatic scaling is aggressive, errors compound.

## Success Criteria

Feature is successful if:
- All survivors maintain Sharpe >0.8 at 2x capital
- Portfolio drawdown never exceeds 20% during testing
- Circuit breakers prevent >90% of dangerous scenarios in simulations
- Correlation stays <0.5 (diversified portfolio)
- Regime analysis identifies optimal conditions for each strategy
- Team has confidence to proceed to stress testing phase

## Next Phase

After scaling survivors and optimizing portfolio risk, proceed to ft-203-stress-testing to simulate worst-case scenarios before going live.
