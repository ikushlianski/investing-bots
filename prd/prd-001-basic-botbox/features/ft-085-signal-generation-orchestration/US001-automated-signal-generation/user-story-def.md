# US-001: Automated Signal Generation

**Feature:** FT-085 Signal Generation & Trade Orchestration
**Story ID:** US-001
**Priority:** P0 (Critical)
**Approved:** false

## Story

**As a** trader,
**I want** my bots to automatically check market conditions every N minutes,
**So that** I don't have to manually trigger checks and can capture trading opportunities 24/7.

## Context

Without automated signal generation, the entire trading system is non-functional. Bots need a mechanism to:
1. Periodically evaluate their assigned strategy
2. Check if entry/exit conditions are met
3. Generate signals when conditions align
4. Do this continuously without manual intervention

This is the core "heartbeat" of the trading system.

## Acceptance Criteria

### AC1: Configurable Check Interval
- [ ] Each bot has a `check_interval_minutes` configuration field
- [ ] Supported intervals: 1, 5, 15, 60 minutes
- [ ] Default: 5 minutes (for 4H strategies)
- [ ] Interval can be changed via Bot Management UI (FT-100)

### AC2: Automatic Strategy Evaluation
- [ ] Cloudflare Cron Trigger fires every 1 minute
- [ ] Orchestrator Worker fetches bots due for check (WHERE last_check_at + interval < NOW)
- [ ] Each bot's Durable Object evaluates strategy independently
- [ ] Strategy evaluation completes in <10 seconds (95th percentile)

### AC3: Signal Logging
- [ ] Every signal evaluation logged to FT-061 (Signal Tracking)
- [ ] Log includes: timestamp, bot ID, strategy conditions, decision (accepted/rejected)
- [ ] Signals visible in Signal Log table within 5 seconds
- [ ] Rejected signals include exact rejection reason

### AC4: No Manual Intervention
- [ ] Bots run 24/7 without manual triggering
- [ ] System recovers automatically from transient failures
- [ ] No user action required after initial bot configuration

### AC5: Performance Targets
- [ ] 100 bots complete signal check cycle in <15 seconds
- [ ] Latency from "due for check" → "signal logged" < 30 seconds
- [ ] Zero duplicate signal evaluations per bot per interval

## Technical Requirements

### Cloudflare Cron Configuration
```toml
# wrangler.toml
[triggers]
crons = ["* * * * *"]  # Every 1 minute
```

### Orchestrator Logic
```typescript
async function orchestrateSignals(env: Env) {
  // Fetch bots due for check
  const bots = await env.DB.prepare(`
    SELECT id, check_interval_minutes
    FROM bots
    WHERE status = 'ACTIVE'
      AND (last_check_at IS NULL OR
           datetime(last_check_at, '+' || check_interval_minutes || ' minutes') <= datetime('now'))
  `).all();

  // Distribute to Durable Objects
  await Promise.allSettled(
    bots.results.map(bot => {
      const botDO = env.BOT_DO.get(env.BOT_DO.idFromName(bot.id));
      return botDO.fetch('/check-signals');
    })
  );
}
```

### Bot Durable Object
```typescript
class BotDurableObject {
  async checkSignals() {
    // 1. Load bot config
    const config = await this.loadConfig();

    // 2. Fetch market data
    const data = await this.fetchMarketData(config.asset);

    // 3. Evaluate strategy
    const signal = await this.evaluateStrategy(config.strategy, data);

    // 4. Log signal
    await this.logSignal(signal);

    // 5. Update last_check_at
    await this.updateLastCheck();

    return signal;
  }
}
```

## Test Scenarios

### Scenario 1: New Bot First Check
```
GIVEN a bot just created with check_interval_minutes = 5
WHEN Cron trigger fires
THEN bot evaluates strategy within 5 seconds
AND last_check_at is set to current timestamp
```

### Scenario 2: Scheduled Check After Interval
```
GIVEN bot with check_interval_minutes = 5
AND last_check_at = 5 minutes ago
WHEN Cron trigger fires
THEN bot evaluates strategy again
AND last_check_at updates to new timestamp
```

### Scenario 3: Skip if Not Due
```
GIVEN bot with check_interval_minutes = 5
AND last_check_at = 2 minutes ago
WHEN Cron trigger fires
THEN bot does NOT evaluate (not due yet)
AND last_check_at unchanged
```

### Scenario 4: 100 Bots Concurrently
```
GIVEN 100 active bots all due for check
WHEN Cron trigger fires
THEN all 100 bots evaluate in parallel
AND cycle completes in <15 seconds
AND no bot evaluated twice
```

## UI/UX Requirements

### Bot Detail Page
```
┌─ Bot: BTC Trend Follower ─────────────────────┐
│                                                │
│ Check Interval: [5 minutes ▼]                 │
│ Last Check: 2 minutes ago (14:35:22)          │
│ Next Check: In 3 minutes (14:40:00)           │
│                                                │
│ Recent Signals (Last 24h): 12 generated       │
│ - 14:35: No signal (conditions not met)       │
│ - 14:30: LONG signal → Trade executed         │
│ - 14:25: No signal (regime unfavorable)       │
│                                                │
│ [Check Now] [View All Signals]                │
└────────────────────────────────────────────────┘
```

### Dashboard Widget
```
┌─ Signal Generation Activity ──────────────────┐
│                                                │
│ Active Bots: 45 / 50                          │
│ Signals Generated (Last Hour): 127            │
│ Trades Executed: 18                           │
│                                                │
│ Next Check Cycle: In 42 seconds               │
│                                                │
│ Recent Activity:                               │
│ ▓▓▓▓▓▓▓░░░░░░░ 14:35 (12 signals)            │
│ ▓▓▓▓▓▓▓▓░░░░░ 14:30 (15 signals)            │
│ ▓▓▓▓▓░░░░░░░░ 14:25 (9 signals)             │
│                                                │
└────────────────────────────────────────────────┘
```

## Dependencies

**Blocks this story:**
- FT-001: Cloudflare infrastructure deployed
- FT-100: Bot Management (bots can be created/configured)
- FT-090: Strategy Framework (strategies can be evaluated)

**Required for full functionality:**
- FT-061: Signal Tracking (to log signals)
- FT-115: Historical Data Management (for market data)

## Open Questions

- ~~Q: Should check interval be global or per-bot?~~
  **A:** Per-bot (different strategies need different intervals)

- ~~Q: What happens if Durable Object evaluation times out (>30s)?~~
  **A:** Log error, skip this cycle, retry next interval

- ~~Q: Should we batch if >100 bots due simultaneously?~~
  **A:** No, Durable Objects handle parallel execution. Batching only if >500 bots.

## Definition of Done

- [ ] Code implemented (Orchestrator Worker + Bot Durable Object)
- [ ] Cron Trigger configured (every 1 minute)
- [ ] Unit tests pass (signal evaluation logic)
- [ ] Integration tests pass (100 bots in <15s)
- [ ] Performance tests pass (latency <30s)
- [ ] Deployed to staging
- [ ] Manual testing: 10 bots run for 24 hours without intervention
- [ ] Signals appear in FT-061 Signal Log
- [ ] Documentation updated (signal generation flow)
- [ ] Code reviewed and approved
- [ ] Deployed to production
- [ ] Monitoring alerts configured
