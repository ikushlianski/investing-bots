# Feature: ft-085 - Signal Generation & Trade Orchestration

**Status:** Proposed (CRITICAL GAP - BLOCKS LIVE TRADING)
**Priority:** P0 (Absolute Blocker)
**Depends On:** ft-001, ft-010, ft-061, ft-080, ft-090, ft-100, ft-115, ft-140

## Problem Statement

**CRITICAL GAP IDENTIFIED**: The current feature set has a complete orchestration gap between "bots exist" and "trades execute."

You have:
- Strategies defined (FT-090)
- Bots configured (FT-100)
- Historical data stored (FT-115)
- Order execution engine ready (FT-010)
- Position tracking ready (FT-080)

But nothing answers: **"How do bots actually check market conditions and generate signals?"**

Without this feature:
- Bots sit idle forever (no trigger to evaluate strategies)
- Strategies never run (no orchestration layer calls them)
- Trades never happen (no signal generation loop)
- System is completely non-functional for live trading

## Current Architecture Gap

**What's Missing:**

```
[Market Data] → ??? → [Signal Generation] → ??? → [Trade Execution]
     ↓                      ↓                        ↓
  Who fetches?        Who triggers?            Who coordinates?
```

**Questions This Feature Answers:**

1. **How do bots monitor market conditions?** → Cloudflare Cron Triggers + Durable Objects
2. **What triggers strategy evaluation?** → Scheduled signal generation loop (1-5 min intervals)
3. **How does data flow from market → signal → trade?** → Orchestration pipeline
4. **How do 50-200 bot instances coordinate without conflicts?** → Durable Objects per bot
5. **How do we respect exchange rate limits?** → Centralized rate limiter + queue

## Goals

- Create the **missing orchestration layer** that makes bots actually work
- Implement **scheduled signal generation** using Cloudflare infrastructure
- Establish **complete data flow** from market data → executed trades
- Handle **50-200 concurrent bot instances** efficiently
- Respect **exchange API rate limits** (critical for not getting banned)
- Enable **sub-minute signal detection** for responsive trading
- Support both **paper trading** and **live trading** modes

## Architecture Decision: Cloudflare Cron Triggers + Durable Objects

### Why This Approach?

**Requirement**: 50-200 bot instances checking 1-5 min intervals = 600-6000 evaluations/hour

**Cloudflare Advantages:**
- **Cost**: Cron triggers free, Durable Objects ~$0.15/million requests
- **Latency**: Edge execution <50ms globally
- **State**: Durable Objects provide strongly consistent bot state
- **Scaling**: Automatic, no infrastructure management
- **Rate Limiting**: Centralized control across all bots

**Alternatives Rejected:**
- ❌ **WebSocket Streams**: Exchange doesn't provide signal-level events, still need polling
- ❌ **Lambda Polling**: Higher cost, harder rate limit coordination
- ❌ **Self-Hosted Cron**: Infrastructure overhead, not serverless

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE CRON TRIGGERS                           │
│                  (Every 1-5 minutes)                                │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SIGNAL ORCHESTRATOR (Worker)                           │
│  - Fetch list of active bots from D1                                │
│  - Distribute to Durable Objects for parallel processing            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  BOT DO #1       │              │  BOT DO #N       │
│  (Durable Object)│              │  (Durable Object)│
│                  │              │                  │
│ 1. Fetch market  │              │ 1. Fetch market  │
│    data          │              │    data          │
│ 2. Evaluate      │              │ 2. Evaluate      │
│    strategy      │              │    strategy      │
│ 3. Generate      │              │ 3. Generate      │
│    signal        │              │    signal        │
│ 4. Validate &    │              │ 4. Validate &    │
│    risk check    │              │    risk check    │
│ 5. Queue trade   │              │ 5. Queue trade   │
│    or reject     │              │    or reject     │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         └─────────────┬───────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │   TRADE EXECUTION QUEUE      │
         │   (D1 or Durable Object)     │
         │   - Rate-limited execution   │
         │   - Deduplication            │
         │   - Retry logic              │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │  ORDER EXECUTION ENGINE      │
         │  (FT-010)                    │
         │  - Submit to exchange        │
         │  - Track fills               │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │  POSITION MANAGEMENT         │
         │  (FT-080)                    │
         │  - Track open positions      │
         └──────────────────────────────┘
```

## Complete Data Flow: Market → Trade

### Phase 1: Scheduled Trigger (Cloudflare Cron)

**Frequency:** Every 1-5 minutes (configurable per deployment)

```typescript
// wrangler.toml
[triggers]
crons = ["*/5 * * * *"]  // Every 5 minutes

// Worker scheduled handler
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    await orchestrateSignalGeneration(env);
  }
}
```

**Cost:** Free (up to 3 cron triggers per Worker)

### Phase 2: Orchestrator Distributes Work

```typescript
async function orchestrateSignalGeneration(env: Env) {
  // 1. Fetch all active bots
  const activeBots = await env.DB.prepare(`
    SELECT id, strategy_id, asset, check_interval_minutes
    FROM bots
    WHERE status = 'ACTIVE'
      AND (last_check_at IS NULL OR
           last_check_at < datetime('now', '-' || check_interval_minutes || ' minutes'))
  `).all();

  // 2. Distribute to Durable Objects for parallel processing
  await Promise.allSettled(
    activeBots.results.map(bot => {
      const botId = env.BOT_DO.idFromName(bot.id);
      const botDO = env.BOT_DO.get(botId);
      return botDO.fetch('/check-signals');
    })
  );
}
```

**Why Durable Objects?**
- Each bot has **isolated state** (no race conditions)
- **Strongly consistent** position tracking
- **Automatic scaling** (one DO per bot)
- **Distributed execution** (parallel processing across edge)

### Phase 3: Bot Durable Object Evaluates Strategy

```typescript
class BotDurableObject {
  async checkSignals(request: Request): Promise<Response> {
    // 1. Load bot configuration and state
    const botConfig = await this.loadBotConfig();
    const botState = await this.loadBotState();

    // 2. Fetch fresh market data
    const marketData = await this.fetchMarketData(botConfig.asset);

    // 3. Evaluate strategy (FT-090 Strategy Framework)
    const strategyResult = await this.evaluateStrategy(
      botConfig.strategy,
      marketData,
      botState
    );

    // 4. No signal? Update timestamp and exit
    if (!strategyResult.signal) {
      await this.updateLastCheck();
      return new Response('No signal', { status: 200 });
    }

    // 5. Signal generated! Log and validate
    const signal = strategyResult.signal;
    await this.logSignal(signal); // FT-061

    // 6. Pre-trade validation
    const validation = await this.validateSignal(signal);
    if (!validation.passed) {
      await this.rejectSignal(signal, validation.reason);
      return new Response('Signal rejected', { status: 200 });
    }

    // 7. Risk management checks (FT-091)
    const riskCheck = await this.checkRiskLimits(signal);
    if (!riskCheck.passed) {
      await this.rejectSignal(signal, riskCheck.reason);
      return new Response('Risk limit exceeded', { status: 200 });
    }

    // 8. Signal accepted! Queue for execution
    await this.queueTrade(signal);

    return new Response('Signal queued', { status: 201 });
  }

  private async evaluateStrategy(
    strategy: Strategy,
    marketData: MarketData,
    botState: BotState
  ): Promise<StrategyResult> {
    // Load strategy factors from FT-090 Factor Library
    const factors = await this.loadFactors(strategy.factorIds);

    // Calculate weighted score
    let score = 0;
    const factorResults = [];

    for (const factor of factors) {
      const factorScore = await factor.calculate(marketData);
      const weightedScore = factorScore * strategy.weights[factor.id];
      score += weightedScore;

      factorResults.push({
        factorId: factor.id,
        score: factorScore,
        weight: strategy.weights[factor.id],
        weighted: weightedScore
      });
    }

    // Check if score crosses entry threshold
    const signal = this.checkThresholds(score, strategy.thresholds);

    return {
      score,
      factorResults,
      signal
    };
  }

  private async validateSignal(signal: Signal): Promise<ValidationResult> {
    // Check market regime (FT-140)
    const regime = await this.getCurrentRegime(signal.asset);
    if (!this.isRegimeFavorable(regime, signal.strategy)) {
      return { passed: false, reason: `Regime unfavorable: ${regime}` };
    }

    // Check for conflicting positions (FT-080)
    const existingPosition = await this.checkExistingPosition(signal.asset, signal.direction);
    if (existingPosition) {
      return { passed: false, reason: 'Duplicate position already open' };
    }

    // Check bot is still active
    const botStatus = await this.getBotStatus();
    if (botStatus !== 'ACTIVE') {
      return { passed: false, reason: `Bot status: ${botStatus}` };
    }

    return { passed: true };
  }

  private async checkRiskLimits(signal: Signal): Promise<RiskCheckResult> {
    // Query portfolio state
    const portfolio = await this.getPortfolioState();

    // Max concurrent positions
    if (portfolio.openPositions >= portfolio.maxPositions) {
      return {
        passed: false,
        reason: `Max positions reached (${portfolio.openPositions}/${portfolio.maxPositions})`
      };
    }

    // Sufficient capital
    const requiredCapital = this.calculatePositionSize(signal, portfolio);
    if (portfolio.availableCapital < requiredCapital) {
      return {
        passed: false,
        reason: `Insufficient capital (need $${requiredCapital}, have $${portfolio.availableCapital})`
      };
    }

    // Correlation limits (prevent too many correlated positions)
    const correlatedCount = await this.countCorrelatedPositions(signal.asset);
    if (correlatedCount >= portfolio.maxCorrelatedPositions) {
      return {
        passed: false,
        reason: `Correlation limit (${correlatedCount} correlated positions)`
      };
    }

    return { passed: true };
  }

  private async queueTrade(signal: Signal): Promise<void> {
    // Insert into execution queue
    await this.env.DB.prepare(`
      INSERT INTO trade_queue (
        id, bot_id, signal_id, asset, direction,
        entry_price, stop_loss, take_profit,
        position_size, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'))
    `).bind(
      generateId(),
      this.botId,
      signal.id,
      signal.asset,
      signal.direction,
      signal.entryPrice,
      signal.stopLoss,
      signal.takeProfit,
      signal.positionSize
    ).run();
  }
}
```

### Phase 4: Trade Execution Queue (Rate-Limited)

**Why Queue?**
- **Rate Limit Protection**: Exchange APIs have strict limits (10-50 req/sec)
- **Deduplication**: Prevent duplicate orders from race conditions
- **Retry Logic**: Handle transient failures
- **Prioritization**: Close orders before open orders

```typescript
class TradeExecutionQueue {
  async processQueue(env: Env): Promise<void> {
    // Fetch pending trades (FIFO, with priority for closes)
    const pendingTrades = await env.DB.prepare(`
      SELECT * FROM trade_queue
      WHERE status = 'PENDING'
      ORDER BY
        CASE WHEN direction = 'CLOSE' THEN 0 ELSE 1 END,
        created_at ASC
      LIMIT 10
    `).all();

    for (const trade of pendingTrades.results) {
      // Check rate limit
      const canExecute = await this.rateLimiter.tryAcquire();
      if (!canExecute) {
        break; // Stop processing, wait for next cron cycle
      }

      // Execute trade via FT-010
      try {
        const order = await this.orderExecutor.submitOrder({
          exchange: trade.exchange,
          symbol: trade.asset,
          side: trade.direction,
          quantity: trade.position_size,
          type: 'MARKET',
          stopLoss: trade.stop_loss,
          takeProfit: trade.take_profit
        });

        // Update queue status
        await this.updateTradeStatus(trade.id, 'EXECUTING', order.id);

        // Create position record (FT-080)
        await this.positionManager.createPosition({
          botId: trade.bot_id,
          orderId: order.id,
          signal: trade.signal_id
        });

      } catch (error) {
        // Log error and retry
        await this.handleExecutionError(trade, error);
      }
    }
  }

  private async updateTradeStatus(
    tradeId: string,
    status: string,
    orderId?: string
  ): Promise<void> {
    await this.env.DB.prepare(`
      UPDATE trade_queue
      SET status = ?, order_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, orderId, tradeId).run();
  }
}
```

### Phase 5: Order Execution (FT-010)

Already implemented in FT-010 Order Execution Engine.

### Phase 6: Position Tracking (FT-080)

Already implemented in FT-080 Position Management.

## Signal Generation Intervals

### Recommended Schedule

**Strategy Type** | **Check Interval** | **Rationale**
--- | --- | ---
Scalping (ST-001) | 1 minute | Fast entries, needs quick detection
Mean Reversion (ST-002) | 5 minutes | Sufficient for range-bound detection
Trend Following (ST-003) | 15 minutes | Longer timeframe, no rush
Grid Trading (ST-004) | 5 minutes | Responsive to grid level hits
Funding Arbitrage (ST-005) | 1 hour | Funding changes are slow

**Configuration per Bot:**

```typescript
interface BotConfig {
  checkIntervalMinutes: 1 | 5 | 15 | 60;
}
```

**Implementation in Orchestrator:**

```sql
-- Only check bots whose interval has elapsed
SELECT * FROM bots
WHERE status = 'ACTIVE'
  AND (last_check_at IS NULL OR
       last_check_at < datetime('now', '-' || check_interval_minutes || ' minutes'))
```

**Master Cron:** Run every 1 minute (catches all intervals)

```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

## Rate Limiting Strategy

### Exchange Limits (ByBit/Binance)

**ByBit:**
- 10 requests/second per IP
- 120 requests/minute (private endpoints)

**Binance:**
- 1200 weight/minute (varies by endpoint)
- Order placement: 10 orders/second

### Rate Limiter Implementation

```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second

  constructor(maxRequestsPerSecond: number) {
    this.maxTokens = maxRequestsPerSecond;
    this.tokens = maxRequestsPerSecond;
    this.refillRate = maxRequestsPerSecond;
    this.lastRefill = Date.now();
  }

  async tryAcquire(): Promise<boolean> {
    // Refill tokens based on time elapsed
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + elapsed * this.refillRate
    );
    this.lastRefill = now;

    // Try to consume a token
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }
}

// Global rate limiter (shared across all bots)
const rateLimiter = new RateLimiter(8); // 8 req/sec (80% of ByBit limit)
```

**Enforcement Points:**
1. **Market Data Fetch**: Before each API call to exchange
2. **Order Submission**: Before submitting orders
3. **Position Queries**: Before querying open positions

**Shared State:** Store in Durable Object to coordinate across all Workers

## Deduplication & Idempotency

### Problem: Duplicate Signals

Scenario: Bot checks at 10:00:00 and 10:00:05 (overlapping execution due to Worker latency)

**Solution 1: Optimistic Locking (Last Check Timestamp)**

```sql
-- Only process if last check was >interval ago
UPDATE bots
SET last_check_at = datetime('now')
WHERE id = ?
  AND (last_check_at IS NULL OR
       last_check_at < datetime('now', '-' || check_interval_minutes || ' minutes'))
RETURNING *;
```

If update returns 0 rows → another Worker already processed this bot → skip

**Solution 2: Signal Deduplication Hash**

```typescript
function generateSignalHash(signal: Signal): string {
  return sha256(`${signal.botId}-${signal.asset}-${signal.direction}-${signal.timestamp}`);
}

// Before logging signal, check if hash exists
const existingSignal = await db.query(
  'SELECT id FROM signals WHERE hash = ?',
  [signalHash]
);

if (existingSignal) {
  return; // Duplicate, skip
}
```

**Solution 3: Trade Queue Deduplication**

```sql
CREATE UNIQUE INDEX idx_trade_queue_dedup
ON trade_queue (bot_id, asset, direction, status)
WHERE status = 'PENDING';
```

Prevents multiple pending orders for same bot + asset + direction.

## Error Handling & Retry Logic

### Transient Failures

**Scenario:** Exchange API timeout during signal check

```typescript
async function checkSignalsWithRetry(botDO: DurableObjectStub): Promise<void> {
  let attempt = 0;
  const maxRetries = 3;
  const backoff = [1000, 5000, 15000]; // ms

  while (attempt < maxRetries) {
    try {
      await botDO.fetch('/check-signals');
      return; // Success
    } catch (error) {
      if (error.code === 'EXCHANGE_TIMEOUT' && attempt < maxRetries - 1) {
        attempt++;
        await sleep(backoff[attempt - 1]);
      } else {
        // Log error, alert monitoring
        await logError('Signal check failed', { botId: bot.id, error });
        throw error;
      }
    }
  }
}
```

### Catastrophic Failures

**Scenario:** Entire exchange API down

```typescript
// Circuit breaker pattern
class ExchangeCircuitBreaker {
  private failureCount = 0;
  private lastFailure = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async executeWithCircuit<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if cooldown period elapsed
      if (Date.now() - this.lastFailure > 60000) {
        this.state = 'HALF_OPEN'; // Try again
      } else {
        throw new Error('Circuit breaker OPEN - exchange unavailable');
      }
    }

    try {
      const result = await fn();
      this.reset(); // Success
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailure = Date.now();

    if (this.failureCount >= 5) {
      this.state = 'OPEN'; // Stop trying
      // Alert operator
      alertOperator('Exchange circuit breaker OPEN');
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

## Cost Analysis

### Cloudflare Workers Pricing (2025)

**Free Tier:**
- 100,000 requests/day
- Unlimited cron triggers (up to 3)

**Paid Tier ($5/month):**
- 10 million requests/month ($0.50 per additional million)
- Durable Objects: $0.15 per million requests

### BotBox Usage Estimate

**Assumptions:**
- 100 active bots
- 5-minute check interval
- 30 days/month

**Calculations:**

**Cron Executions:**
- 1 cron/minute × 60 min × 24 hr × 30 days = 43,200 executions/month
- Cost: **FREE** (crons are free)

**Bot Durable Object Calls:**
- 100 bots × 12 checks/hour × 24 hr × 30 days = 864,000 calls/month
- Cost: 0.864M × $0.15 = **$0.13/month**

**Trade Executions:**
- Assume 10% of checks generate signals: 86,400 signals/month
- Assume 20% pass validation: 17,280 trades/month
- Order API calls: 17,280 × 2 (order + fill check) = 34,560 calls
- Cost: 0.035M × $0.50 = **$0.02/month**

**Total Cloudflare Cost: ~$0.15/month** (negligible)

**Real Costs:**
- Exchange API fees (trading commissions): $50-500/month depending on volume
- TimescaleDB hosting: $25-100/month
- Total: **$75-600/month** (dominated by trading fees, not infrastructure)

**Comparison:**
- AWS Lambda equivalent: $10-50/month (67-333x more expensive)
- Self-hosted VPS: $20-100/month + maintenance overhead

**Verdict:** Cloudflare is **dramatically cheaper** for this use case.

## Monitoring & Observability

### Key Metrics

**Signal Generation:**
- Signals generated per hour (by bot, by strategy)
- Signal acceptance rate (accepted / total)
- Average signal evaluation latency

**Execution:**
- Trade queue depth
- Order execution latency (queue → exchange)
- Order fill rate (filled / submitted)

**Errors:**
- Exchange API errors (timeouts, rate limits)
- Signal validation failures (by reason)
- Trade execution failures (by reason)

**Resource Usage:**
- Durable Object CPU time
- Rate limiter token availability
- Market data cache hit rate

### Alerts

**Critical (Immediate Action):**
- Exchange circuit breaker OPEN (trading halted)
- Rate limit exceeded (risk of ban)
- Trade execution failure rate >10%

**Warning (Review Within 1 Hour):**
- Signal generation latency >10 seconds
- Trade queue depth >100
- Signal rejection rate >80% (too conservative?)

**Info (Daily Review):**
- Signals generated per strategy (monitor activity)
- Most common rejection reasons (optimize filters)

### Dashboards

**Operator Dashboard:**
- Active bots count
- Signals generated (last hour/day)
- Trades executed (last hour/day)
- Current queue depth
- Exchange health status

**Per-Bot Dashboard:**
- Last signal check timestamp
- Signals generated (accept/reject)
- Current positions
- Recent trades
- P&L

## Implementation Phases

### Phase 1: MVP Signal Loop (Week 1-2)

**Deliverables:**
- Cloudflare Cron trigger (every 5 min)
- Simple orchestrator (fetch active bots)
- Basic bot signal check (without Durable Objects)
- Queue trades in D1
- Manual execution (no auto-execution yet)

**Test:** Can generate and log signals for 10 bots

### Phase 2: Durable Objects + Auto-Execution (Week 3-4)

**Deliverables:**
- Migrate bot state to Durable Objects
- Implement per-bot signal evaluation
- Auto-execute trades from queue
- Rate limiter integration
- Deduplication logic

**Test:** 100 bots running, trades execute automatically

### Phase 3: Optimization & Monitoring (Week 5-6)

**Deliverables:**
- Circuit breaker pattern
- Advanced retry logic
- Monitoring dashboards
- Alert system
- Performance tuning

**Test:** System runs 24/7 without manual intervention

### Phase 4: Advanced Features (Week 7-8)

**Deliverables:**
- Dynamic interval adjustment (faster checks during volatility)
- Signal caching (avoid redundant calculations)
- Multi-timeframe analysis
- A/B testing infrastructure

**Test:** Support 200+ bots with <5% resource usage increase

## User Stories

### US-001: Automated Signal Generation

**As a trader**, I want my bots to automatically check market conditions every N minutes, so I don't have to manually trigger checks.

**Acceptance Criteria:**
- Configure check interval per bot (1, 5, 15, 60 minutes)
- Bots automatically evaluate strategy at configured interval
- Signal generation logged (FT-061)
- No manual intervention required

### US-002: Trade Execution from Signals

**As a trader**, when my bot generates a valid signal, I want it to automatically execute the trade, so I capture opportunities in real-time.

**Acceptance Criteria:**
- Signal passes validation → queued for execution
- Trade executes within 30 seconds (95th percentile)
- Position created in FT-080
- Economics tracked in FT-110

### US-003: Signal Generation Dashboard

**As a trader**, I want to see real-time signal generation activity, so I know my bots are working.

**Acceptance Criteria:**
- Dashboard shows: Bots active, signals generated (last hour), trades executed
- Per-bot: Last check time, next check time, recent signals
- System health: Queue depth, exchange status, error rate

### US-004: Manual Signal Trigger

**As a trader**, I want to manually trigger a signal check for a bot, so I can test without waiting for the scheduled interval.

**Acceptance Criteria:**
- "Check Now" button on bot detail page
- Triggers immediate signal evaluation
- Shows result within 5 seconds
- Does not interfere with scheduled checks

### US-005: Pause Signal Generation

**As a trader**, I want to pause signal generation for all bots during high volatility, so I can avoid trading in unfavorable conditions.

**Acceptance Criteria:**
- "Pause All Bots" button on dashboard
- Stops signal generation for all active bots
- Existing positions remain open (not auto-closed)
- Resume manually or after timeout

## Technical Debt & Future Improvements

### Known Limitations (MVP)

**1. Market Data Freshness**
- Current: Fetch on every signal check (increases API calls)
- Future: Shared market data cache (1-minute TTL), reduces API load by 90%

**2. Strategy Evaluation Performance**
- Current: Re-calculate all indicators per bot
- Future: Pre-calculate common indicators (RSI, EMA) and share across bots

**3. Single Exchange Focus**
- Current: Optimized for ByBit
- Future: Multi-exchange coordination (cross-exchange arbitrage)

**4. Fixed Intervals**
- Current: Static check interval per bot
- Future: Adaptive intervals (faster during volatility, slower during consolidation)

**5. No Multi-Timeframe Analysis**
- Current: Single timeframe per strategy
- Future: Strategies can check multiple timeframes before signaling

### Scaling Considerations

**At 500 Bots:**
- Cron orchestrator may timeout (max 30s Worker execution)
- Solution: Batch processing (process 100 bots/cycle, rotate batches)

**At 1000 Bots:**
- D1 query performance may degrade
- Solution: Shard bots across multiple D1 databases by exchange/asset

**At 10,000 Signals/Hour:**
- Trade queue processing bottleneck
- Solution: Dedicated execution Worker (separate from cron orchestrator)

## Dependencies

**Critical (Blocks Implementation):**
- FT-001: Application Framework (Cloudflare infrastructure)
- FT-010: Order Execution Engine (submit trades)
- FT-080: Position Management (track positions)
- FT-090: Strategy Creation Framework (evaluate strategies)
- FT-100: Bot Management (bot configuration)

**Important (Impacts Functionality):**
- FT-061: Signal Tracking (log signals)
- FT-091: Risk Management Framework (risk checks)
- FT-115: Historical Data Management (fetch market data)
- FT-140: Market Regime Detection (regime validation)

**Optional (Enhances Features):**
- FT-130: Monitoring & Alerts (signal generation alerts)
- FT-136: TradingView Charts (visualize signals on charts)

## Risks & Mitigations

### Risk: Exchange API Ban

**Scenario:** Exceed rate limits, get IP banned

**Mitigation:**
- Aggressive rate limiter (80% of published limits)
- Circuit breaker on repeated failures
- Backoff on 429 responses
- Monitor rate limit headers

**Detection:** Alert when rate limiter blocks >20% of requests

### Risk: Duplicate Orders

**Scenario:** Race condition creates 2 orders for same signal

**Mitigation:**
- Unique constraint on trade queue (bot + asset + direction)
- Optimistic locking on bot last_check_at
- Signal hash deduplication

**Detection:** Alert on duplicate order errors from exchange

### Risk: Signal Evaluation Timeout

**Scenario:** Complex strategy takes >30s, Worker times out

**Mitigation:**
- Set strategy evaluation timeout (10s max)
- Cache indicator calculations
- Optimize factor library

**Detection:** Monitor Worker CPU time, alert on >20s evaluations

### Risk: Market Data Staleness

**Scenario:** Bot trades on 5-minute-old data during flash crash

**Mitigation:**
- Timestamp all market data
- Reject signals if data >2 minutes old
- Increase check frequency during high volatility

**Detection:** Log data age, alert if consistently stale

### Risk: Cloudflare Outage

**Scenario:** Cloudflare Workers unavailable, no signal generation

**Mitigation:**
- Accept temporary downtime (better than self-hosted maintenance burden)
- Existing positions still monitored by position manager
- Resume automatically when service restored

**Detection:** External uptime monitor (UptimeRobot)

## Testing Strategy

### Unit Tests

**Bot Signal Check:**
- Strategy conditions met → signal generated
- Strategy conditions not met → no signal
- Validation failed → signal rejected
- Risk check failed → signal rejected

**Rate Limiter:**
- Tokens refill at correct rate
- Blocks requests when exhausted
- Allows requests when tokens available

**Deduplication:**
- Duplicate signal hash → skipped
- Unique signal hash → processed

### Integration Tests

**End-to-End Signal Flow:**
1. Cron triggers orchestrator
2. Orchestrator fetches active bots
3. Bot evaluates strategy
4. Signal generated and validated
5. Trade queued
6. Trade executed
7. Position created

**Paper Trading Mode:**
- Signals generated but not executed
- Hypothetical P&L calculated
- No real orders submitted

### Load Tests

**100 Bots:**
- Orchestrator processes all bots in <10s
- No rate limit violations
- All signals logged

**1000 Signals/Hour:**
- Queue processes without backlog
- Order execution latency <30s (p95)
- Zero duplicate orders

### Chaos Tests

**Exchange API Failure:**
- Circuit breaker opens after 5 failures
- Signal generation paused
- Resumes automatically after cooldown

**Database Timeout:**
- Retry logic works
- No data corruption
- Graceful degradation

## Success Metrics

**Reliability:**
- Signal generation uptime >99.9%
- Order execution success rate >99%
- Zero duplicate orders

**Performance:**
- Signal evaluation latency <5s (p95)
- Trade execution latency <30s (p95)
- Rate limit violations: 0

**Efficiency:**
- Infrastructure cost <$1/month (excluding trading fees)
- API calls per signal <3
- Bot overhead <100ms CPU per check

**Business Impact:**
- Bots capture >90% of generated signals
- Signal rejection rate 20-40% (indicates healthy filtering)
- Position entry latency <1 minute from signal

## Open Questions

**Q: Should signal checks run in parallel or sequentially per bot?**
- **Recommendation:** Parallel via Durable Objects (faster, isolated state)

**Q: How to handle bot configuration changes during signal evaluation?**
- **Recommendation:** Load config at start of evaluation, ignore mid-evaluation changes

**Q: Should we pre-fetch market data for all assets, or fetch per-bot?**
- **Recommendation:** Per-bot initially (simpler), shared cache in Phase 2 (optimization)

**Q: What happens if a bot is deleted while signal evaluation is in progress?**
- **Recommendation:** Check bot status before queuing trade, skip if deleted

**Q: Should signals expire if not executed within N minutes?**
- **Recommendation:** Yes, 5-minute TTL (market conditions change quickly)

## Related Features

**Orchestration Pipeline:**
- FT-085 (this feature) → FT-061 (log signals) → FT-010 (execute) → FT-080 (track positions)

**Configuration:**
- FT-100 (bot config) → FT-085 (read config) → FT-090 (evaluate strategy)

**Validation:**
- FT-085 (generate signal) → FT-091 (risk check) → FT-140 (regime check) → FT-061 (log decision)

**Monitoring:**
- FT-085 (signal activity) → FT-130 (alerts) → FT-131 (dashboard)
