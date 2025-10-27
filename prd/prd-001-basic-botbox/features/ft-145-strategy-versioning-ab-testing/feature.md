# Feature: ft-145 - Strategy Versioning & A/B Testing

**Status:** Planned
**Priority:** P1
**Phase:** 2

## Problem Statement

Strategies evolve—parameters get tuned, logic gets refined. Without systematic versioning and testing, you can't know if v2 is actually better than v1. Deploying untested strategy changes risks replacing a profitable strategy with a losing one.

## Goals

- Version every strategy change immutably
- Run v1 and v2 side-by-side with equal capital
- Statistically determine which version performs better
- Automatically promote winners, disable losers
- Track what changed between versions

## Success Metrics

- 100% of strategy changes tracked with version number
- A/B tests reach statistical significance within 30-100 trades
- Zero accidental strategy overwrites (immutability enforced)
- Rollback capability: restore previous version in <5 minutes

## User Stories

### US-001: Create New Strategy Version
**As a trader**, I want to save a new version of my strategy when I change parameters, so I can compare it to the current version.

**Acceptance Criteria:**
- Edit strategy parameters (e.g., change RSI threshold from 30 to 35)
- Click "Save as New Version"
- System assigns version: `RSI-Mean-Reversion-v1.3.0`
- Version changelog auto-generated: "Changed RSI oversold threshold: 30 → 35"
- Previous version (v1.2.0) remains unchanged and deployable

### US-002: Deploy A/B Test
**As a trader**, I want to run v1 and v2 side-by-side to compare performance, so I can make data-driven decisions.

**Acceptance Criteria:**
- Select two strategy versions: v1.2.0 (Champion) vs v1.3.0 (Challenger)
- Configure test:
  - Capital per version: $5,000 each
  - Test duration: 50 trades or 30 days (whichever first)
  - Success criteria: "Promote Challenger if Sharpe ratio >1.2x Champion"
- Click "Start A/B Test"
- Two bots created: "Bot-RSI-v1.2.0" and "Bot-RSI-v1.3.0"
- Both bots trade same asset, same conditions, different strategy logic

### US-003: Compare A/B Test Results
**As a trader**, I want to see side-by-side performance metrics, so I know which version is better.

**Acceptance Criteria:**
- A/B Test dashboard shows:
  - Champion (v1.2.0) vs Challenger (v1.3.0)
  - Total P&L: $+420 vs $+580
  - Win rate: 58% vs 64%
  - Sharpe ratio: 1.3 vs 1.8
  - Max drawdown: -8% vs -5%
  - Trades: 50 vs 50
- Statistical significance indicator: "95% confident Challenger is better"
- Recommendation: "Promote Challenger to Champion"

### US-004: Auto-Promote Winner
**As a trader**, I want the system to automatically promote the better version, so I don't have to manually decide.

**Acceptance Criteria:**
- Configure auto-promotion rules:
  - "After 50 trades, if Challenger Sharpe >1.2x Champion, promote"
  - "If Challenger total P&L >Champion by >20%, promote"
  - "If Challenger max DD >15%, never promote (too risky)"
- After 50 trades, Challenger meets criteria
- Alert: "Challenger v1.3.0 promoted to Champion (Sharpe 1.8 vs 1.3)"
- Champion bot (v1.2.0) paused, Challenger bot becomes primary
- Version registry updated: v1.3.0 marked as "Current Champion"

### US-005: Rollback to Previous Version
**As a trader**, I want to quickly rollback to a previous version if the new one underperforms, so I can stop losses fast.

**Acceptance Criteria:**
- New Champion (v1.3.0) deployed to production
- After 10 trades, losing money unexpectedly
- Navigate to version history, select v1.2.0 (previous Champion)
- Click "Rollback to v1.2.0"
- Current bots using v1.3.0 paused
- New bot created using v1.2.0
- Alert: "Rolled back to v1.2.0, v1.3.0 disabled"
- Takes <2 minutes total

## Technical Requirements

### Strategy Version Model

```typescript
interface StrategyVersion {
  id: string  // "RSI-Mean-Reversion-v1.3.0"
  strategyName: string  // "RSI-Mean-Reversion"
  version: string  // "1.3.0" (semantic versioning)
  status: "Draft" | "Testing" | "Champion" | "Challenger" | "Archived"
  parameters: Record<string, any>  // Strategy-specific params
  createdAt: Date
  createdBy: string
  parentVersionId?: string  // Links to v1.2.0
  changelog: string  // Auto-generated or manual
  performanceHistory: VersionPerformance[]
  isImmutable: boolean  // true after first deployment
}

interface VersionPerformance {
  testPeriod: { start: Date, end: Date }
  totalPnL: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  totalTrades: number
  regime?: string  // Optional: performance in specific market regime
}
```

### Versioning Rules

**Semantic Versioning:**
- Major (X.0.0): Complete strategy logic change
- Minor (x.Y.0): Parameter tuning, small logic tweaks
- Patch (x.y.Z): Bug fixes, no logic change

**Immutability:**
- Once deployed (status ≠ "Draft"), version parameters locked
- Any change creates new version
- Prevents accidental overwrites

### A/B Test Configuration

```typescript
interface ABTest {
  id: string
  championVersionId: string  // Current best version
  challengerVersionId: string  // New version to test
  config: {
    capitalPerVersion: number  // $5,000 each
    maxTrades: number  // 50 trades
    maxDurationDays: number  // 30 days
    endCondition: "whichever_first" | "both_met"
  }
  promotionCriteria: {
    minSharpeRatio?: number  // Challenger Sharpe >1.2x Champion
    minPnLImprovement?: number  // Challenger P&L >20% better
    maxDrawdownThreshold?: number  // Never promote if DD >15%
    minTrades?: number  // Need 30 trades minimum for significance
  }
  status: "Running" | "Completed" | "Auto-Promoted" | "Manually Stopped"
  startedAt: Date
  completedAt?: Date
  winner?: "champion" | "challenger" | "inconclusive"
}
```

### Auto-Promotion Logic

**After Each Trade in A/B Test:**
```
if test.trades >= test.config.maxTrades or test.durationDays >= test.config.maxDurationDays:
  challenger = calculatePerformance(challengerBot)
  champion = calculatePerformance(championBot)

  if challenger.sharpeRatio > champion.sharpeRatio * 1.2:
    if challenger.maxDrawdown < 15%:
      if challenger.trades >= 30:
        promoteChallenger()
        alert("Auto-promoted Challenger v1.3.0")
      else:
        alert("Challenger winning but insufficient sample size")
  else:
    alert("A/B test complete: Champion remains v1.2.0")
    pauseChallenger()
```

### Version Comparison

**Automated Changelog:**
When creating new version from existing:
```typescript
function generateChangelog(oldVersion, newVersion) {
  const changes = []
  for (const [key, value] of Object.entries(newVersion.parameters)) {
    if (oldVersion.parameters[key] !== value) {
      changes.push(`${key}: ${oldVersion.parameters[key]} → ${value}`)
    }
  }
  return changes.join("\n")
}
```

**Example:**
```
v1.3.0 (based on v1.2.0):
- rsiOversoldThreshold: 30 → 35
- rsiOverboughtThreshold: 70 → 68
- positionSizePercent: 2.0 → 1.5
```

## Dashboard Requirements

**Version Registry Page:**
- List all versions for a strategy
- Columns: Version, Status, Created, Trades, P&L, Sharpe, Actions
- Color-code status: Champion (gold), Testing (blue), Archived (gray)
- Click version → view detailed performance + changelog

**A/B Test Monitor:**
- Live comparison panel: Champion vs Challenger
- Progress bar: "25/50 trades completed"
- Real-time metrics update after each trade
- Statistical significance indicator
- "Stop Test" button (manual override)
- "Promote Challenger" button (if criteria met)

## Testing Strategy

**Critical Tests:**
1. Create v1.1.0, deploy it → verify immutable (can't edit parameters)
2. Create v1.2.0 with different params → verify changelog generated
3. Start A/B test with 10 trades → verify both bots trade in parallel
4. Challenger outperforms after 10 trades → verify auto-promotion triggers
5. Rollback to v1.0.0 → verify current version disabled, v1.0.0 re-activated

## Dependencies

- FT-090: Strategy Development (provides base strategy framework)
- FT-100: Bot Management (creates/deploys bots per version)
- FT-135: Live Performance Analytics (calculates metrics per version)
- FT-120: Backtesting (can backtest each version before A/B test)

## Open Questions

- Should A/B tests allocate equal capital or equal position sizes?
  - **Recommendation**: Equal capital (fairer for risk comparison)
- How many trades minimum before auto-promotion?
  - **Recommendation**: 30 trades (statistical significance threshold)
- Should we support multi-variant testing (v1 vs v2 vs v3)?
  - **Recommendation**: Phase 2 feature, start with simple A/B
- What if both versions perform poorly?
  - **Recommendation**: Neither promoted, alert "Both versions underperforming, review strategy"
