title: FT-204 Weekly Monitoring Workflow
feature-id: ft-204
status: planned
priority: P1
phase: Months 1-12 (All phases)

## Overview

Establish a systematic weekly review process to monitor strategy performance, catch degradation early, and make data-driven decisions about strategy allocation. This is the operational heartbeat of testnet trading.

## Problem Statement

Without a structured monitoring cadence, critical issues go unnoticed:
- Strategy performance degrading slowly over time
- Max drawdown creeping toward danger zone
- Correlation between strategies increasing
- Backtest vs live divergence growing
- Errors and warnings accumulating in logs

Weekly reviews catch problems early, when they're fixable. Monthly reviews are too slow.

## Goals

Automate weekly performance report generation.

Create standardized checklist for review:
- P&L per strategy
- Max drawdown status
- Correlation matrix
- Error/warning log review
- Backtest vs live divergence

Flag anomalies automatically for investigation.

Maintain decision log of actions taken.

## Success Metrics

- Weekly review completed every 7 days (100% compliance)
- Anomalies flagged automatically (no manual hunting)
- Decision log maintained (every action documented)
- Degradation caught within 2 weeks
- Review process takes <30 minutes per week

## Weekly Monitoring Checklist

### 1. P&L Review

**For each strategy:**
- Total P&L this week
- Cumulative P&L
- P&L trend (improving/stable/declining)
- Win rate this week vs baseline
- Number of trades executed

**Flags:**
- Red: Weekly P&L negative for 2 consecutive weeks
- Yellow: Win rate dropped >10% vs baseline
- Green: On track

### 2. Max Drawdown Check

**For each strategy:**
- Current drawdown from peak
- Max drawdown this week
- Max drawdown all-time

**Thresholds:**
- Warning: Drawdown >25%
- Critical: Drawdown >30%
- Kill: Drawdown >40%

**Action:**
- If approaching 30%, reduce position size by 50%
- If exceeds 40%, pause strategy and investigate

### 3. Correlation Matrix

**Portfolio level:**
- Calculate pairwise correlation (last 30 days)
- Compare to previous week

**Flags:**
- Red: Correlation >0.7 (too similar, concentrated risk)
- Yellow: Correlation 0.5-0.7 (watch closely)
- Green: Correlation <0.5 (good diversification)

**Action:**
- If correlation >0.7, consider pausing one strategy or reducing allocation

### 4. Error & Warning Log Review

**System health:**
- Count errors by type (API failures, webhook losses, execution errors)
- Count warnings (slippage alerts, slow responses)

**Thresholds:**
- Red: >10 errors this week
- Yellow: >5 errors or >20 warnings
- Green: <5 errors, <10 warnings

**Action:**
- Investigate root cause of recurring errors
- Fix or mitigate

### 5. Backtest vs Live Divergence

**For each strategy:**
- Backtest expected P&L (based on historical data)
- Actual live/paper trading P&L
- Divergence percentage

**Thresholds:**
- Green: Divergence <10%
- Yellow: Divergence 10-20%
- Red: Divergence >20%

**Action:**
- If >20%, investigate:
  - Is slippage higher than expected?
  - Are fills worse than backtest assumed?
  - Has market regime changed?

### 6. Open Questions & Action Items

**From previous week:**
- Review open items from last week
- Mark completed or carry forward

**New items:**
- Document any concerns or observations
- Assign action items for next week

## Automated Weekly Report

Generate automatically every Monday morning:

```markdown
# Weekly Trading Report - Week of [Date]

## Executive Summary
- Total Portfolio P&L: +$420 (+2.8%)
- Best Performer: Strategy A (+$320)
- Worst Performer: Strategy C (-$50)
- Alerts: 2 warnings, 0 errors
- Status: Green (all systems operational)

## Per-Strategy Performance

### Strategy A: Mean Reversion Top-5
- P&L this week: +$320 (+4.2%)
- Cumulative P&L: +$1,240 (+12.4%)
- Trades: 8 (6 wins, 2 losses, 75% win rate)
- Max drawdown: 8% (within limits)
- Status: Green

### Strategy B: Trend Following
- P&L this week: +$150 (+1.5%)
- Cumulative P&L: +$890 (+8.9%)
- Trades: 5 (3 wins, 2 losses, 60% win rate)
- Max drawdown: 12% (within limits)
- Status: Green

### Strategy C: Low-Cap Momentum
- P&L this week: -$50 (-1.0%)
- Cumulative P&L: -$200 (-4.0%)
- Trades: 3 (1 win, 2 losses, 33% win rate)
- Max drawdown: 18% (warning threshold)
- Status: Yellow (watch closely)

## Risk Metrics

### Correlation Matrix
|           | Strategy A | Strategy B | Strategy C |
|-----------|-----------|-----------|-----------|
| Strategy A | 1.00      | 0.42      | 0.31      |
| Strategy B | 0.42      | 1.00      | 0.58      |
| Strategy C | 0.31      | 0.58      | 1.00      |

Status: Green (all correlations <0.7)

### Portfolio Drawdown
- Current drawdown: 5%
- Max drawdown this week: 8%
- Max drawdown all-time: 11%
- Status: Green (well below 15% limit)

## System Health

### Errors & Warnings
- API errors: 2 (Binance timeout on 2025-11-03)
- Execution warnings: 5 (slippage >0.3% on 3 trades)
- Webhook failures: 0

Status: Green (below thresholds)

### Backtest vs Live Divergence
- Strategy A: -5% (live performing slightly worse)
- Strategy B: +3% (live performing slightly better)
- Strategy C: -12% (investigate slippage)

Status: Yellow (Strategy C divergence approaching 15%)

## Action Items for This Week

1. [Yellow] Investigate Strategy C slippage
   - Check order book depth on low-cap altcoins
   - Consider reducing position size

2. [Yellow] Monitor Strategy C drawdown
   - Currently 18%, approaching 20% warning
   - If reaches 20%, reduce position size by 50%

3. [Info] Review correlation between Strategy B and C
   - Currently 0.58, watch for increase

## Open Questions
- Should we pause Strategy C if drawdown reaches 20%?
- Is slippage on low-cap coins acceptable or strategy-breaking?

---
Generated: 2025-11-04 08:00 UTC
Next review: 2025-11-11
```

## User Stories

### US-001: Auto-Generated Weekly Report
As a trader, I want an automated weekly report emailed to me, so I don't have to manually compile data.

Acceptance Criteria:
- Report generated every Monday at 8am
- Emailed as PDF and HTML
- Includes all checklist sections
- Highlights flags (red/yellow/green)
- Action items clearly listed

### US-002: Interactive Review Dashboard
As a trader, I want an interactive dashboard for weekly review, so I can drill into details.

Acceptance Criteria:
- One-page overview with all key metrics
- Click any metric to see details
- Export to PDF for record-keeping
- Archive past weekly reports
- Trend charts: P&L, drawdown, correlation over time

### US-003: Decision Log
As a trader, I want to log decisions made during review, so I can track what actions I took and why.

Acceptance Criteria:
- For each action item: log decision and rationale
- Examples:
  - "Paused Strategy C due to 22% drawdown, will review in 2 weeks"
  - "Reduced Strategy A position size by 30% due to high correlation with B"
- Timestamped entries
- Searchable history
- Export decision log for retrospective analysis

### US-004: Anomaly Alerts
As a trader, I want automatic alerts when metrics cross thresholds, so I don't miss critical issues.

Acceptance Criteria:
- Email/SMS if any strategy exceeds max drawdown warning (20%)
- Alert if correlation >0.7 between any pair
- Alert if backtest divergence >20%
- Alert if errors >10 in a week
- Alerts include recommended action

## Technical Requirements

### Weekly Report Generator

```typescript
interface WeeklyReport {
  weekOf: Date
  executiveSummary: {
    totalPnL: number
    totalPnLPercent: number
    bestPerformer: { strategyId: string; pnl: number }
    worstPerformer: { strategyId: string; pnl: number }
    alertCount: { errors: number; warnings: number }
    overallStatus: 'green' | 'yellow' | 'red'
  }
  strategyPerformance: StrategyWeeklyMetrics[]
  riskMetrics: {
    correlationMatrix: number[][]
    portfolioDrawdown: number
    maxDrawdownThisWeek: number
    maxDrawdownAllTime: number
  }
  systemHealth: {
    errors: ErrorSummary[]
    warnings: WarningSummary[]
    backtestDivergence: DivergenceMetrics[]
  }
  actionItems: ActionItem[]
  openQuestions: string[]
}

interface StrategyWeeklyMetrics {
  strategyId: string
  strategyName: string
  pnlThisWeek: number
  pnlThisWeekPercent: number
  cumulativePnL: number
  cumulativePnLPercent: number
  tradesThisWeek: number
  winRate: number
  currentDrawdown: number
  maxDrawdownThisWeek: number
  status: 'green' | 'yellow' | 'red'
  concerns: string[]
}

class WeeklyReportGenerator {
  async generateReport(weekOf: Date): Promise<WeeklyReport> {
    const strategies = await getActiveStrategies()

    const strategyMetrics = await Promise.all(
      strategies.map(s => this.calculateStrategyMetrics(s, weekOf))
    )

    const correlationMatrix = await calculateCorrelationMatrix(strategies, weekOf)

    const systemHealth = await this.analyzeSystemHealth(weekOf)

    const actionItems = this.generateActionItems(strategyMetrics, correlationMatrix, systemHealth)

    return {
      weekOf,
      executiveSummary: this.generateExecutiveSummary(strategyMetrics),
      strategyPerformance: strategyMetrics,
      riskMetrics: {
        correlationMatrix,
        portfolioDrawdown: await calculatePortfolioDrawdown(weekOf),
        maxDrawdownThisWeek: Math.max(...strategyMetrics.map(s => s.maxDrawdownThisWeek)),
        maxDrawdownAllTime: await getMaxDrawdownAllTime(),
      },
      systemHealth,
      actionItems,
      openQuestions: [],
    }
  }

  private generateActionItems(
    strategyMetrics: StrategyWeeklyMetrics[],
    correlationMatrix: number[][],
    systemHealth: SystemHealth
  ): ActionItem[] {
    const items: ActionItem[] = []

    strategyMetrics.forEach(sm => {
      if (sm.currentDrawdown > 0.20) {
        items.push({
          priority: 'high',
          description: `Strategy ${sm.strategyName} drawdown at ${sm.currentDrawdown}%, reduce position size`,
          dueDate: addDays(new Date(), 3),
        })
      }

      if (sm.status === 'red') {
        items.push({
          priority: 'critical',
          description: `Strategy ${sm.strategyName} failing kill criteria, investigate immediately`,
          dueDate: addDays(new Date(), 1),
        })
      }
    })

    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix.length; j++) {
        if (correlationMatrix[i][j] > 0.7) {
          items.push({
            priority: 'medium',
            description: `High correlation (${correlationMatrix[i][j]}) between strategies, review allocation`,
            dueDate: addDays(new Date(), 7),
          })
        }
      }
    }

    return items
  }
}
```

### Decision Log Schema

```typescript
interface DecisionLogEntry {
  id: string
  timestamp: Date
  weekOf: Date
  strategyId?: string
  category: 'position_size' | 'pause_strategy' | 'kill_strategy' | 'allocation_change' | 'other'
  decision: string
  rationale: string
  expectedOutcome: string
  actualOutcome?: string
  reviewDate: Date
}

const decisionLog: DecisionLogEntry[] = [
  {
    id: '001',
    timestamp: new Date('2025-11-04'),
    weekOf: new Date('2025-11-04'),
    strategyId: 'ST-003',
    category: 'position_size',
    decision: 'Reduced position size by 50%',
    rationale: 'Drawdown reached 22%, approaching 25% warning threshold',
    expectedOutcome: 'Lower volatility, reduced drawdown risk',
    reviewDate: new Date('2025-11-18'),
  },
]
```

### Anomaly Detector

```typescript
interface Anomaly {
  type: 'drawdown' | 'correlation' | 'divergence' | 'error_rate'
  severity: 'warning' | 'critical'
  description: string
  affectedStrategies: string[]
  threshold: number
  actualValue: number
  recommendedAction: string
}

class AnomalyDetector {
  detectAnomalies(report: WeeklyReport): Anomaly[] {
    const anomalies: Anomaly[] = []

    report.strategyPerformance.forEach(sp => {
      if (sp.currentDrawdown > 0.25) {
        anomalies.push({
          type: 'drawdown',
          severity: sp.currentDrawdown > 0.30 ? 'critical' : 'warning',
          description: `Strategy ${sp.strategyName} drawdown at ${sp.currentDrawdown * 100}%`,
          affectedStrategies: [sp.strategyId],
          threshold: 0.25,
          actualValue: sp.currentDrawdown,
          recommendedAction: 'Reduce position size by 50% or pause strategy',
        })
      }
    })

    const correlationMatrix = report.riskMetrics.correlationMatrix
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix.length; j++) {
        if (correlationMatrix[i][j] > 0.7) {
          anomalies.push({
            type: 'correlation',
            severity: 'warning',
            description: `High correlation between strategies`,
            affectedStrategies: [report.strategyPerformance[i].strategyId, report.strategyPerformance[j].strategyId],
            threshold: 0.7,
            actualValue: correlationMatrix[i][j],
            recommendedAction: 'Review allocation, consider pausing one strategy',
          })
        }
      }
    }

    return anomalies
  }
}
```

## Dependencies

- FT-113: Strategy Performance Analytics (provides metrics)
- FT-112: Portfolio Analytics (portfolio-level data)
- FT-130: Monitoring & Alerts (alert delivery)
- FT-140: Market Regime Detection (regime context)

## Testing Strategy

Critical tests:
1. Generate weekly report → verify all sections populated
2. Trigger anomaly (drawdown >25%) → verify flagged in report
3. Email delivery → verify arrives within 5 minutes of generation
4. Decision log entry → verify searchable and exportable
5. Multi-week trend → verify historical comparison working

## Expected Outcomes

By implementing weekly monitoring:
- Problems caught within 2 weeks max (vs months of silent degradation)
- Clear decision trail for learning from mistakes
- Systematic process reduces oversight risk
- Team confidence in operational discipline

## Open Questions

1. Should reports be auto-generated or manually triggered?
   - Recommendation: Auto-generated, but manual re-run option available

2. Who receives the report?
   - Recommendation: All team members + archive in shared folder

3. How long to keep historical reports?
   - Recommendation: Forever (disk space is cheap, data is valuable)

4. Should we use email, Slack, or dashboard-only?
   - Recommendation: Email + dashboard. Slack optional for critical alerts.

## Success Criteria

Feature is successful if:
- Weekly reports generated on schedule (100% compliance)
- Review process takes <30 minutes
- Anomalies flagged automatically (no manual hunting)
- Decision log maintained for every action
- Team can answer: "What happened 3 weeks ago?" from reports
- Degradation caught within 2 weeks of onset

## Integration with Other Features

Works in tandem with:
- FT-201: Kill criteria flagged in weekly report
- FT-202: Scaling decisions logged and reviewed weekly
- FT-203: Stress test results included in system health
- FT-130: Monitoring alerts supplement weekly review (real-time + weekly batch)
