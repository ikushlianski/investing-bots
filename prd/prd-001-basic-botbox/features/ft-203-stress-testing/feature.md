title: FT-203 Stress Testing & Production Readiness
feature-id: ft-203
status: planned
priority: P0
phase: Months 10-12 (Stress testing)

## Overview

Simulate worst-case scenarios, validate monitoring systems, and ensure the platform is bulletproof before transitioning to real money. This phase separates theory from reality.

## Problem Statement

Strategies that work in normal conditions often fail catastrophically during:
- Flash crashes (30% drop in minutes)
- Exchange API outages
- Webhook delivery failures
- Network connectivity issues
- Extreme volatility events
- Liquidity droughts

Without stress testing these scenarios, you're gambling that nothing will go wrong. It will.

The goal: Find and fix failure modes in testnet before they cost real money.

## Goals

Simulate worst-case scenarios:
- Flash crashes (sudden -30% moves)
- API outages (exchange down for 10+ minutes)
- Webhook failures (TradingView alerts not delivered)
- High slippage events (0.5-1% vs expected 0.1%)
- Position stuck scenarios (can't exit due to low liquidity)

Validate monitoring and alerts:
- Every failure scenario triggers alerts
- Alerts arrive <30 seconds
- Dashboard reflects reality
- Logging captures root cause

Ensure paper trading matches backtest:
- Divergence <20% over 90 days
- No systematic bias (paper trading isn't accidentally optimistic)
- Execution assumptions realistic

## Success Metrics

- 100% of stress scenarios detected and alerted within 30 seconds
- Circuit breakers prevent catastrophic loss in 95%+ of simulated disasters
- Monitoring catches all API failures, webhook losses, stuck positions
- Paper trading results match backtest within 20%
- Team can confidently explain every failure mode and mitigation
- Zero silent failures during stress tests

## Stress Test Scenarios

### Scenario 1: Flash Crash

**Setup:**
- BTC drops 30% in 10 minutes
- Volatility spikes 500%
- Spreads widen to 1%
- Exchange API slows to 5-second responses

**Expected Behavior:**
- Stop-losses trigger correctly
- Circuit breakers halt new trades
- High volatility filter pauses entries
- Alerts sent immediately
- Dashboard shows accurate P&L

**Test Pass Criteria:**
- Max portfolio drawdown <25%
- All alerts delivered <30s
- No stuck positions
- System recovers gracefully

### Scenario 2: API Outage

**Setup:**
- Exchange API goes down for 15 minutes
- All order placement/cancellation fails
- Position data unavailable

**Expected Behavior:**
- System detects API failure within 60 seconds
- Alert: "Exchange API down"
- Bots pause (don't try to trade blind)
- Retry logic attempts reconnection every 60s
- When API returns, system resumes

**Test Pass Criteria:**
- Failure detected in <60s
- No orders attempted during outage
- Successful reconnection
- No data corruption

### Scenario 3: Webhook Delivery Failure

**Setup:**
- TradingView sends alert, webhook server doesn't receive it
- Or webhook received but processing fails

**Expected Behavior:**
- System detects missing webhook (expected but not received)
- Alert: "Webhook delivery failed for Strategy X"
- Manual inspection triggered
- Fallback: query TradingView logs or use alternative signal source

**Test Pass Criteria:**
- Webhook gap detected within expected interval + 10%
- Alert sent
- No positions opened based on phantom signals

### Scenario 4: High Slippage Event

**Setup:**
- Limit order placed at $50,000
- Market moves fast, filled at $50,500 (1% slippage)
- Much worse than backtested 0.1%

**Expected Behavior:**
- Slippage logged
- Alert if slippage >0.5%
- Strategy performance adjusted for reality
- If slippage consistently high, strategy may fail real-world test

**Test Pass Criteria:**
- Slippage tracked per trade
- Alert on excessive slippage
- Strategy profitability recalculated with real slippage
- Kill strategy if no longer profitable with real-world fills

### Scenario 5: Position Stuck (Can't Exit)

**Setup:**
- Bot tries to sell altcoin, but order book too thin
- Limit order sits unfilled
- Market moves against position

**Expected Behavior:**
- System detects unfilled exit order after 5 minutes
- Alert: "Exit order unfilled, position stuck"
- Fallback: switch to market order (accept slippage)
- If still can't exit: manual intervention alert

**Test Pass Criteria:**
- Stuck position detected <5 minutes
- Fallback logic executes
- Manual alert sent if fallback fails
- Position eventually closed (even if loss)

### Scenario 6: Correlation Cascade

**Setup:**
- All 3 strategies long crypto
- Market crashes
- All strategies hit stop-loss simultaneously

**Expected Behavior:**
- Portfolio drawdown limit triggers (>15%)
- Circuit breaker halts new trades
- Alert: "Portfolio drawdown exceeded, trading halted"
- Positions closed or reduced per risk rules

**Test Pass Criteria:**
- Drawdown detected correctly
- Circuit breaker fires
- System doesn't attempt new trades until reset
- Loss contained <20% of portfolio

### Scenario 7: Network Connectivity Loss

**Setup:**
- Bot server loses internet for 5 minutes
- Can't reach exchange API
- Can't send alerts

**Expected Behavior:**
- System detects connectivity loss
- Attempts to close positions before full disconnect (if time)
- Logs all failures locally
- Upon reconnection: sync state, send batched alerts

**Test Pass Criteria:**
- Connectivity loss detected
- No corrupt state on reconnection
- All events logged
- Alerts sent once connectivity restored

## Validation Tests

### Test 1: Backtest vs Paper Trading Divergence

**Goal:** Ensure paper trading isn't overly optimistic.

**Method:**
- Run backtest on last 90 days
- Run paper trading on same 90 days (if data available)
- Compare:
  - Total P&L
  - Win rate
  - Max drawdown
  - Number of trades

**Pass Criteria:**
- Divergence <20% on all metrics
- Paper trading slightly worse than backtest (realistic)
- No systematic bias detected

### Test 2: Monitoring Coverage

**Goal:** Ensure every failure mode triggers alert.

**Method:**
- List all possible failures
- Simulate each
- Verify alert sent

**Failure Modes Checklist:**
- API down
- Webhook lost
- High slippage
- Stuck position
- Drawdown exceeded
- Correlation spike
- Balance anomaly
- Order placement failed
- Execution timeout

**Pass Criteria:**
- 100% of failures trigger alerts
- All alerts arrive <30s
- Dashboard updated correctly

### Test 3: Alert Delivery Reliability

**Goal:** Ensure alerts always reach you.

**Method:**
- Simulate 50 alert scenarios
- Track delivery time
- Check for lost alerts

**Pass Criteria:**
- 100% delivery rate
- Median delivery time <15s
- 95th percentile <30s
- No duplicate alerts for same event

## User Stories

### US-001: Run Stress Test Simulation
As a trader, I want to simulate disaster scenarios, so I can validate that safety systems work before going live.

Acceptance Criteria:
- UI to select stress test scenario
- Click "Run Simulation"
- System executes scenario (flash crash, API outage, etc.)
- Report generated:
  - What happened
  - How system responded
  - Which alerts fired
  - Pass/fail result

### US-002: Stress Test Dashboard
As a trader, I want a dashboard showing all stress test results, so I can review system resilience.

Acceptance Criteria:
- Table of all scenarios run
- Pass/fail status per scenario
- Details: alerts triggered, circuit breakers fired, recovery time
- Drill-down: see logs for specific test
- Export report for review

### US-003: Backtest vs Live Divergence Report
As a trader, I want to see if paper trading matches backtest, so I can trust performance projections.

Acceptance Criteria:
- Side-by-side comparison:
  - Backtest metrics
  - Paper trading metrics
  - Divergence percentage
- Chart: equity curve comparison
- Explanation of divergence (slippage, fees, execution timing)
- Pass/fail: <20% divergence = pass

### US-004: Monitoring Coverage Report
As a trader, I want confirmation that all failure modes are monitored, so I know nothing can fail silently.

Acceptance Criteria:
- Checklist of failure modes
- For each: "Monitored" or "Not monitored"
- Test results: did alert fire when simulated?
- 100% coverage required to pass
- Quarterly re-test recommended

## Technical Requirements

### Stress Test Framework

```typescript
interface StressTestScenario {
  id: string
  name: string
  description: string
  severity: 'minor' | 'major' | 'catastrophic'
  setup: () => void
  execute: () => Promise<StressTestResult>
  validate: (result: StressTestResult) => boolean
}

interface StressTestResult {
  scenarioId: string
  executedAt: Date
  duration: number
  eventsTriggered: Event[]
  alertsSent: Alert[]
  circuitBreakersFired: CircuitBreaker[]
  finalState: SystemState
  passed: boolean
  failureReasons: string[]
  recovery: {
    successful: boolean
    timeToRecover: number
  }
}

class StressTestRunner {
  async runScenario(scenario: StressTestScenario): Promise<StressTestResult> {
    scenario.setup()

    const startTime = Date.now()
    const events: Event[] = []
    const alerts: Alert[] = []

    const result = await scenario.execute()

    const duration = Date.now() - startTime

    const passed = scenario.validate(result)

    return {
      scenarioId: scenario.id,
      executedAt: new Date(),
      duration,
      eventsTriggered: events,
      alertsSent: alerts,
      passed,
      ...result,
    }
  }
}
```

### Flash Crash Simulator

```typescript
function simulateFlashCrash(
  asset: string,
  dropPercent: number,
  durationMinutes: number
): void {
  const currentPrice = getCurrentPrice(asset)
  const targetPrice = currentPrice * (1 - dropPercent / 100)

  const priceSteps = 20
  const timeStepMs = (durationMinutes * 60 * 1000) / priceSteps

  let currentStep = 0

  const interval = setInterval(() => {
    const progress = currentStep / priceSteps
    const newPrice = currentPrice - (currentPrice - targetPrice) * progress

    injectFakePrice(asset, newPrice)

    if (currentStep >= priceSteps) {
      clearInterval(interval)
    }

    currentStep++
  }, timeStepMs)
}
```

### API Failure Simulator

```typescript
class APIFailureSimulator {
  simulateOutage(durationMinutes: number): void {
    const originalExchangeAPI = global.exchangeAPI

    global.exchangeAPI = {
      placeOrder: () => {
        throw new Error('Exchange API unavailable')
      },
      cancelOrder: () => {
        throw new Error('Exchange API unavailable')
      },
      getPositions: () => {
        throw new Error('Exchange API unavailable')
      },
      getBalance: () => {
        throw new Error('Exchange API unavailable')
      },
    }

    setTimeout(() => {
      global.exchangeAPI = originalExchangeAPI
    }, durationMinutes * 60 * 1000)
  }
}
```

### Monitoring Coverage Validator

```typescript
interface FailureMode {
  id: string
  name: string
  monitored: boolean
  alertTriggersCorrectly: boolean
  lastTested: Date
}

const requiredMonitoring: FailureMode[] = [
  { id: 'api_down', name: 'Exchange API Down', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
  { id: 'webhook_lost', name: 'Webhook Not Delivered', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
  { id: 'high_slippage', name: 'Slippage >0.5%', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
  { id: 'stuck_position', name: 'Exit Order Unfilled >5min', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
  { id: 'drawdown_exceeded', name: 'Portfolio Drawdown >15%', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
  { id: 'balance_anomaly', name: 'Balance Drop >10% in 1 hour', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
  { id: 'connectivity_loss', name: 'Network Connectivity Lost', monitored: true, alertTriggersCorrectly: true, lastTested: new Date() },
]

function validateMonitoringCoverage(): boolean {
  return requiredMonitoring.every(fm => fm.monitored && fm.alertTriggersCorrectly)
}
```

## Dependencies

- FT-202: Focus on Survivors (provides strategies to stress test)
- FT-130: Monitoring & Alerts (validates alert system)
- FT-091: Risk Management Framework (circuit breakers)
- FT-120: Strategy Validation Suite (backtest comparison)

## Testing Strategy

Run all 7 stress scenarios weekly during Months 10-12.

Track:
- Pass/fail per scenario
- Time to recovery
- Alert delivery success rate
- Circuit breaker effectiveness

Document failures:
- What went wrong?
- Why did it happen?
- How was it fixed?
- Retest to confirm fix

## Expected Outcomes

By end of Month 12:
- All stress scenarios pass
- 100% monitoring coverage
- Alert delivery >99% reliable
- Backtest vs paper trading divergence <15%
- Team confident in system resilience
- Ready for real money deployment (if desired)

## Open Questions

1. Should we test with real exchange testnet or fully simulated environment?
   - Recommendation: Real exchange testnet for API testing, simulated for extreme scenarios (flash crash)

2. How often should stress tests be re-run after going live?
   - Recommendation: Monthly for critical scenarios, quarterly for all scenarios

3. What if a scenario fails repeatedly?
   - Recommendation: Do not proceed to live trading until fixed and retested

4. Should stress testing be automated or manual?
   - Recommendation: Automate execution, manual review of results

## Success Criteria

Feature is successful if:
- 100% of stress scenarios pass
- No silent failures detected
- Alert system 99%+ reliable
- Backtest vs live divergence <20%
- Circuit breakers prevent catastrophic loss in all tests
- Team can confidently answer: "What happens if X fails?"
- Production readiness checklist 100% complete

## Production Readiness Checklist

Before going live with real money:
- [ ] All stress scenarios passed
- [ ] Monitoring coverage 100%
- [ ] Alert delivery tested and reliable
- [ ] Circuit breakers tested and functional
- [ ] Backtest vs paper trading divergence <20%
- [ ] All failure modes documented with mitigations
- [ ] Team trained on emergency procedures
- [ ] Manual kill-switch tested and accessible
- [ ] Backup contact methods (phone, SMS) configured
- [ ] Legal/compliance review completed (if applicable)
- [ ] Start with small capital (10% of planned amount)

## Next Phase

After stress testing passes, optionally proceed to live trading with small capital or continue testnet indefinitely for further learning and strategy development.
