# Implementation Guide: Signal Generation & Trade Orchestration

**Feature:** FT-085 - Signal Generation & Trade Orchestration
**Complexity:** HIGH (Touches all core systems)
**Estimated Effort:** 6-8 weeks (phased rollout)

## Executive Summary

This guide provides step-by-step implementation instructions for the critical orchestration layer that enables automated trading.

**What You're Building:**
- Cloudflare Cron Trigger (scheduled signal checks)
- Signal Orchestrator Worker (coordinates bots)
- Bot Durable Objects (isolated signal evaluation)
- Trade Execution Queue (rate-limited order submission)
- End-to-end monitoring (observability)

**End State:**
- 100+ bots automatically checking market conditions every 1-5 minutes
- Signals generated, validated, and executed without manual intervention
- Full audit trail of every signal (accepted or rejected)
- Sub-$1/month infrastructure cost

## Prerequisites

**Required Features (Must Be Complete):**
- ✅ FT-001: Application Framework (Cloudflare Workers setup)
- ✅ FT-010: Order Execution Engine (exchange API integration)
- ✅ FT-080: Position Management (track open positions)
- ✅ FT-090: Strategy Creation Framework (factor library, scoring)
- ✅ FT-100: Bot Management (bot CRUD, configuration)

**Nice-to-Have (Can Implement in Parallel):**
- ⏳ FT-061: Signal Tracking (signal logging)
- ⏳ FT-091: Risk Management Framework (risk checks)
- ⏳ FT-140: Market Regime Detection (regime validation)

**Database Schema (Must Exist):**
```sql
-- Bots table
CREATE TABLE bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  status TEXT NOT NULL, -- 'ACTIVE', 'PAUSED', 'ARCHIVED'
  check_interval_minutes INTEGER DEFAULT 5,
  last_check_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Trade queue table
CREATE TABLE trade_queue (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL REFERENCES bots(id),
  signal_id TEXT,
  asset TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'LONG', 'SHORT', 'CLOSE'
  entry_price REAL,
  stop_loss REAL,
  take_profit REAL,
  position_size REAL,
  status TEXT NOT NULL, -- 'PENDING', 'EXECUTING', 'COMPLETED', 'FAILED'
  order_id TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Signals table (FT-061)
CREATE TABLE signals (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL REFERENCES bots(id),
  timestamp TEXT NOT NULL,
  asset TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'LONG', 'SHORT'
  decision TEXT NOT NULL, -- 'ACCEPTED', 'REJECTED'
  rejection_reason TEXT,
  conditions TEXT, -- JSON
  validation TEXT, -- JSON
  risk_checks TEXT, -- JSON
  market_context TEXT, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Phase 1: Cron Trigger Setup (Week 1)

### Step 1.1: Configure Wrangler

**File:** `wrangler.toml`

```toml
name = "botbox-orchestrator"
main = "src/workers/orchestrator.ts"
compatibility_date = "2025-10-27"

# Cron Trigger (every 1 minute)
[triggers]
crons = ["* * * * *"]

# D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "botbox-production"
database_id = "your-d1-database-id"

# Durable Object Bindings
[[durable_objects.bindings]]
name = "BOT_DO"
class_name = "BotDurableObject"
script_name = "botbox-orchestrator"

[[migrations]]
tag = "v1"
new_classes = ["BotDurableObject"]
```

### Step 1.2: Create Orchestrator Worker

**File:** `src/workers/orchestrator.ts`

```typescript
interface Env {
  DB: D1Database;
  BOT_DO: DurableObjectNamespace;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered at:', new Date(event.scheduledTime).toISOString());

    try {
      await orchestrateSignalGeneration(env);
    } catch (error) {
      console.error('Orchestration failed:', error);
      // Alert monitoring system (future)
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    // Health check endpoint
    if (request.url.endsWith('/health')) {
      return new Response('OK', { status: 200 });
    }

    // Manual trigger endpoint (for testing)
    if (request.url.endsWith('/trigger')) {
      await orchestrateSignalGeneration(env);
      return new Response('Orchestration triggered', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  }
};

async function orchestrateSignalGeneration(env: Env): Promise<void> {
  const startTime = Date.now();

  // 1. Fetch active bots that are due for checking
  const { results: bots } = await env.DB.prepare(`
    SELECT id, name, asset, strategy_id, check_interval_minutes
    FROM bots
    WHERE status = 'ACTIVE'
      AND (
        last_check_at IS NULL
        OR datetime(last_check_at, '+' || check_interval_minutes || ' minutes') <= datetime('now')
      )
  `).all();

  console.log(`Found ${bots.length} bots to check`);

  // 2. Distribute to Durable Objects (parallel execution)
  const results = await Promise.allSettled(
    bots.map(bot => checkBotSignals(env, bot))
  );

  // 3. Log results
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Orchestration complete: ${succeeded} succeeded, ${failed} failed (${Date.now() - startTime}ms)`);
}

async function checkBotSignals(env: Env, bot: any): Promise<void> {
  try {
    // Get Durable Object for this bot
    const botId = env.BOT_DO.idFromName(bot.id);
    const botDO = env.BOT_DO.get(botId);

    // Trigger signal check
    const response = await botDO.fetch('https://bot/check-signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot })
    });

    if (!response.ok) {
      throw new Error(`Bot ${bot.id} check failed: ${response.statusText}`);
    }

    console.log(`Bot ${bot.name} check completed`);
  } catch (error) {
    console.error(`Bot ${bot.name} check error:`, error);
    throw error;
  }
}
```

### Step 1.3: Deploy and Test

```bash
# Deploy to Cloudflare
npx wrangler deploy

# Test manual trigger
curl https://your-worker.workers.dev/trigger

# Check logs
npx wrangler tail
```

**Success Criteria:**
- ✅ Cron executes every 1 minute
- ✅ Orchestrator fetches active bots from D1
- ✅ Logs show "Found N bots to check"
- ✅ No errors in deployment

## Phase 2: Bot Durable Object (Week 2-3)

### Step 2.1: Create Bot Durable Object Class

**File:** `src/durable-objects/bot-durable-object.ts`

```typescript
import { DurableObject } from 'cloudflare:workers';

interface Env {
  DB: D1Database;
}

interface BotConfig {
  id: string;
  name: string;
  asset: string;
  strategy_id: string;
  check_interval_minutes: number;
}

interface Signal {
  id: string;
  botId: string;
  timestamp: string;
  asset: string;
  signalType: 'LONG' | 'SHORT';
  conditions: any[];
  score: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

export class BotDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/check-signals' && request.method === 'POST') {
      return await this.checkSignals(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async checkSignals(request: Request): Promise<Response> {
    try {
      // Parse bot config from request
      const { bot } = await request.json() as { bot: BotConfig };

      console.log(`[Bot ${bot.name}] Starting signal check`);

      // 1. Fetch market data
      const marketData = await this.fetchMarketData(bot.asset);

      // 2. Evaluate strategy
      const strategyResult = await this.evaluateStrategy(bot, marketData);

      // 3. Update last check timestamp
      await this.updateLastCheck(bot.id);

      // 4. No signal? Exit early
      if (!strategyResult.signal) {
        console.log(`[Bot ${bot.name}] No signal generated`);
        return new Response(JSON.stringify({ signal: null }), { status: 200 });
      }

      // 5. Signal generated! Validate and process
      const signal = strategyResult.signal;
      console.log(`[Bot ${bot.name}] Signal generated: ${signal.signalType} at $${signal.entryPrice}`);

      // 6. Log signal (FT-061)
      await this.logSignal(bot, signal, 'PENDING');

      // 7. Validate signal
      const validation = await this.validateSignal(bot, signal);
      if (!validation.passed) {
        console.log(`[Bot ${bot.name}] Signal rejected: ${validation.reason}`);
        await this.updateSignalDecision(signal.id, 'REJECTED', validation.reason);
        return new Response(JSON.stringify({ signal: null, reason: validation.reason }), { status: 200 });
      }

      // 8. Check risk limits
      const riskCheck = await this.checkRiskLimits(bot, signal);
      if (!riskCheck.passed) {
        console.log(`[Bot ${bot.name}] Risk check failed: ${riskCheck.reason}`);
        await this.updateSignalDecision(signal.id, 'REJECTED', riskCheck.reason);
        return new Response(JSON.stringify({ signal: null, reason: riskCheck.reason }), { status: 200 });
      }

      // 9. Signal accepted! Queue for execution
      await this.queueTrade(bot, signal);
      await this.updateSignalDecision(signal.id, 'ACCEPTED', null);

      console.log(`[Bot ${bot.name}] Signal accepted and queued`);

      return new Response(JSON.stringify({ signal, status: 'queued' }), { status: 201 });

    } catch (error) {
      console.error('Signal check error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  private async fetchMarketData(asset: string): Promise<any> {
    // TODO: Integrate with FT-115 Historical Data Management
    // For now, mock data
    return {
      symbol: asset,
      price: 60000 + Math.random() * 1000,
      rsi: 30 + Math.random() * 40,
      volume: 1000000,
      timestamp: new Date().toISOString()
    };
  }

  private async evaluateStrategy(bot: BotConfig, marketData: any): Promise<{ signal: Signal | null; score: number }> {
    // TODO: Integrate with FT-090 Strategy Framework
    // For now, simple mock logic

    // Simulate: signal if RSI < 35 (oversold)
    if (marketData.rsi < 35) {
      const signal: Signal = {
        id: crypto.randomUUID(),
        botId: bot.id,
        timestamp: new Date().toISOString(),
        asset: bot.asset,
        signalType: 'LONG',
        conditions: [
          { name: 'RSI Oversold', value: marketData.rsi, threshold: 35, met: true }
        ],
        score: (35 - marketData.rsi) / 35, // 0-1 score
        entryPrice: marketData.price,
        stopLoss: marketData.price * 0.98, // 2% stop loss
        takeProfit: marketData.price * 1.04 // 4% take profit
      };

      return { signal, score: signal.score };
    }

    return { signal: null, score: marketData.rsi / 100 };
  }

  private async validateSignal(bot: BotConfig, signal: Signal): Promise<{ passed: boolean; reason?: string }> {
    // TODO: Integrate with FT-140 Market Regime Detection
    // For now, basic checks

    // Check 1: No conflicting position
    const existingPosition = await this.env.DB.prepare(`
      SELECT id FROM positions
      WHERE bot_id = ? AND asset = ? AND status = 'OPEN'
    `).bind(bot.id, signal.asset).first();

    if (existingPosition) {
      return { passed: false, reason: 'Duplicate position already open' };
    }

    // Check 2: Bot still active
    const botStatus = await this.env.DB.prepare(`
      SELECT status FROM bots WHERE id = ?
    `).bind(bot.id).first();

    if (botStatus?.status !== 'ACTIVE') {
      return { passed: false, reason: `Bot status: ${botStatus?.status}` };
    }

    return { passed: true };
  }

  private async checkRiskLimits(bot: BotConfig, signal: Signal): Promise<{ passed: boolean; reason?: string }> {
    // TODO: Integrate with FT-091 Risk Management Framework
    // For now, basic portfolio check

    // Check max concurrent positions
    const { count } = await this.env.DB.prepare(`
      SELECT COUNT(*) as count FROM positions
      WHERE bot_id = ? AND status = 'OPEN'
    `).bind(bot.id).first() as { count: number };

    const MAX_POSITIONS = 6;

    if (count >= MAX_POSITIONS) {
      return { passed: false, reason: `Max positions reached (${count}/${MAX_POSITIONS})` };
    }

    return { passed: true };
  }

  private async queueTrade(bot: BotConfig, signal: Signal): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO trade_queue (
        id, bot_id, signal_id, asset, direction,
        entry_price, stop_loss, take_profit, position_size, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).bind(
      crypto.randomUUID(),
      bot.id,
      signal.id,
      signal.asset,
      signal.signalType,
      signal.entryPrice,
      signal.stopLoss,
      signal.takeProfit,
      0.01, // TODO: Calculate position size from risk parameters
      ).run();
  }

  private async logSignal(bot: BotConfig, signal: Signal, decision: string): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO signals (
        id, bot_id, timestamp, asset, signal_type, decision,
        conditions, market_context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      signal.id,
      bot.id,
      signal.timestamp,
      signal.asset,
      signal.signalType,
      decision,
      JSON.stringify(signal.conditions),
      JSON.stringify({ price: signal.entryPrice, score: signal.score })
    ).run();
  }

  private async updateSignalDecision(signalId: string, decision: string, reason: string | null): Promise<void> {
    await this.env.DB.prepare(`
      UPDATE signals
      SET decision = ?, rejection_reason = ?
      WHERE id = ?
    `).bind(decision, reason, signalId).run();
  }

  private async updateLastCheck(botId: string): Promise<void> {
    await this.env.DB.prepare(`
      UPDATE bots
      SET last_check_at = datetime('now')
      WHERE id = ?
    `).bind(botId).run();
  }
}
```

### Step 2.2: Export Durable Object

**File:** `src/workers/orchestrator.ts` (update)

```typescript
// Add export for Durable Object
export { BotDurableObject } from '../durable-objects/bot-durable-object';
```

### Step 2.3: Test Bot Signal Evaluation

```bash
# Deploy updated Worker with Durable Object
npx wrangler deploy

# Create test bot in D1
npx wrangler d1 execute botbox-production --command "
INSERT INTO bots (id, name, strategy_id, asset, status, check_interval_minutes)
VALUES ('bot-001', 'Test Bot', 'strategy-001', 'BTC/USDT', 'ACTIVE', 5);
"

# Trigger cron manually (or wait 1 minute)
curl https://your-worker.workers.dev/trigger

# Check logs
npx wrangler tail

# Verify signal logged
npx wrangler d1 execute botbox-production --command "SELECT * FROM signals;"
```

**Success Criteria:**
- ✅ Bot Durable Object created per bot
- ✅ Signal evaluation executed
- ✅ Signal logged to D1 (accepted or rejected)
- ✅ last_check_at updated for bot

## Phase 3: Trade Execution Queue (Week 4-5)

### Step 3.1: Create Queue Processor

**File:** `src/services/trade-queue-processor.ts`

```typescript
interface Env {
  DB: D1Database;
  ORDER_EXECUTOR: any; // FT-010 service
  RATE_LIMITER: DurableObjectNamespace;
}

interface QueuedTrade {
  id: string;
  bot_id: string;
  signal_id: string;
  asset: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  position_size: number;
}

export class TradeQueueProcessor {
  constructor(private env: Env) {}

  async processQueue(): Promise<void> {
    const startTime = Date.now();

    // Fetch pending trades (FIFO, prioritize closes)
    const { results: trades } = await this.env.DB.prepare(`
      SELECT * FROM trade_queue
      WHERE status = 'PENDING'
      ORDER BY
        CASE WHEN direction = 'CLOSE' THEN 0 ELSE 1 END,
        created_at ASC
      LIMIT 10
    `).all();

    console.log(`Processing ${trades.length} queued trades`);

    for (const trade of trades) {
      try {
        // Check rate limit
        const allowed = await this.checkRateLimit(trade.asset);
        if (!allowed) {
          console.log('Rate limit reached, stopping queue processing');
          break;
        }

        // Execute trade
        await this.executeTrade(trade as QueuedTrade);

      } catch (error) {
        console.error(`Trade ${trade.id} execution error:`, error);
        await this.handleExecutionError(trade.id, error.message);
      }
    }

    console.log(`Queue processing complete (${Date.now() - startTime}ms)`);
  }

  private async checkRateLimit(asset: string): Promise<boolean> {
    // TODO: Integrate with rate limiter Durable Object
    // For now, simple sleep
    await new Promise(resolve => setTimeout(resolve, 100)); // 10 req/sec
    return true;
  }

  private async executeTrade(trade: QueuedTrade): Promise<void> {
    console.log(`Executing trade ${trade.id}: ${trade.direction} ${trade.asset}`);

    // Update status to EXECUTING
    await this.env.DB.prepare(`
      UPDATE trade_queue
      SET status = 'EXECUTING', updated_at = datetime('now')
      WHERE id = ?
    `).bind(trade.id).run();

    // Submit order via FT-010 Order Execution Engine
    // TODO: Integrate with actual order executor
    const order = await this.submitOrder(trade);

    // Update queue with order ID
    await this.env.DB.prepare(`
      UPDATE trade_queue
      SET status = 'COMPLETED', order_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(order.id, trade.id).run();

    // Create position record (FT-080)
    // TODO: Integrate with position manager
    await this.createPosition(trade, order);

    console.log(`Trade ${trade.id} completed, order ${order.id}`);
  }

  private async submitOrder(trade: QueuedTrade): Promise<{ id: string }> {
    // Mock order submission
    // TODO: Replace with actual FT-010 integration
    return {
      id: `order-${Date.now()}`
    };
  }

  private async createPosition(trade: QueuedTrade, order: { id: string }): Promise<void> {
    // Mock position creation
    // TODO: Replace with actual FT-080 integration
    console.log(`Position created for order ${order.id}`);
  }

  private async handleExecutionError(tradeId: string, errorMessage: string): Promise<void> {
    await this.env.DB.prepare(`
      UPDATE trade_queue
      SET status = 'FAILED', error_message = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(errorMessage, tradeId).run();
  }
}
```

### Step 3.2: Add Queue Processing to Cron

**File:** `src/workers/orchestrator.ts` (update)

```typescript
import { TradeQueueProcessor } from '../services/trade-queue-processor';

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered at:', new Date(event.scheduledTime).toISOString());

    try {
      // 1. Generate signals
      await orchestrateSignalGeneration(env);

      // 2. Process trade queue
      const queueProcessor = new TradeQueueProcessor(env);
      await queueProcessor.processQueue();

    } catch (error) {
      console.error('Orchestration failed:', error);
    }
  }
};
```

### Step 3.3: Test End-to-End Flow

```bash
# Deploy updated Worker
npx wrangler deploy

# Trigger cron (or wait 1 minute)
curl https://your-worker.workers.dev/trigger

# Check logs (should see signal → queue → execution)
npx wrangler tail

# Verify trade queue processed
npx wrangler d1 execute botbox-production --command "SELECT * FROM trade_queue;"
```

**Success Criteria:**
- ✅ Signal generated → queued → executed (end-to-end)
- ✅ Trade queue status: PENDING → EXECUTING → COMPLETED
- ✅ No duplicate orders
- ✅ Rate limiting respected

## Phase 4: Monitoring & Production Readiness (Week 6)

### Step 4.1: Add Health Metrics

**File:** `src/services/metrics-collector.ts`

```typescript
interface Metrics {
  timestamp: string;
  activeBotsCount: number;
  signalsGenerated: number;
  signalsAccepted: number;
  signalsRejected: number;
  tradesExecuted: number;
  tradesFailed: number;
  queueDepth: number;
  avgSignalLatency: number;
}

export async function collectMetrics(env: Env): Promise<Metrics> {
  const [
    activeBotsCount,
    signalsLastHour,
    tradesLastHour,
    queueDepth
  ] = await Promise.all([
    // Active bots
    env.DB.prepare(`SELECT COUNT(*) as count FROM bots WHERE status = 'ACTIVE'`).first(),

    // Signals last hour
    env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN decision = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN decision = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM signals
      WHERE timestamp > datetime('now', '-1 hour')
    `).first(),

    // Trades last hour
    env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
      FROM trade_queue
      WHERE created_at > datetime('now', '-1 hour')
    `).first(),

    // Queue depth
    env.DB.prepare(`SELECT COUNT(*) as count FROM trade_queue WHERE status = 'PENDING'`).first()
  ]);

  return {
    timestamp: new Date().toISOString(),
    activeBotsCount: activeBotsCount.count,
    signalsGenerated: signalsLastHour.total || 0,
    signalsAccepted: signalsLastHour.accepted || 0,
    signalsRejected: signalsLastHour.rejected || 0,
    tradesExecuted: tradesLastHour.completed || 0,
    tradesFailed: tradesLastHour.failed || 0,
    queueDepth: queueDepth.count,
    avgSignalLatency: 0 // TODO: Calculate from logs
  };
}
```

### Step 4.2: Add Metrics Endpoint

**File:** `src/workers/orchestrator.ts` (update)

```typescript
import { collectMetrics } from '../services/metrics-collector';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ... existing endpoints ...

    // Metrics endpoint
    if (request.url.endsWith('/metrics')) {
      const metrics = await collectMetrics(env);
      return new Response(JSON.stringify(metrics, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

### Step 4.3: Create Dashboard Widget

**File:** `src/components/orchestration-dashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';

interface Metrics {
  timestamp: string;
  activeBotsCount: number;
  signalsGenerated: number;
  signalsAccepted: number;
  signalsRejected: number;
  tradesExecuted: number;
  tradesFailed: number;
  queueDepth: number;
}

export function OrchestrationDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/orchestrator/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!metrics) return <div>Failed to load metrics</div>;

  const acceptanceRate = metrics.signalsGenerated > 0
    ? ((metrics.signalsAccepted / metrics.signalsGenerated) * 100).toFixed(1)
    : '0';

  return (
    <div className="orchestration-dashboard">
      <h2>Signal Generation Status</h2>

      <div className="metrics-grid">
        <MetricCard
          title="Active Bots"
          value={metrics.activeBotsCount}
          icon="🤖"
        />

        <MetricCard
          title="Signals (Last Hour)"
          value={metrics.signalsGenerated}
          subtitle={`${acceptanceRate}% accepted`}
          icon="📡"
        />

        <MetricCard
          title="Trades Executed"
          value={metrics.tradesExecuted}
          subtitle={metrics.tradesFailed > 0 ? `${metrics.tradesFailed} failed` : undefined}
          icon="💹"
        />

        <MetricCard
          title="Queue Depth"
          value={metrics.queueDepth}
          warning={metrics.queueDepth > 50}
          icon="📋"
        />
      </div>

      <div className="signal-breakdown">
        <h3>Signal Breakdown (Last Hour)</h3>
        <div className="breakdown-bar">
          <div
            className="accepted"
            style={{ width: `${(metrics.signalsAccepted / metrics.signalsGenerated) * 100}%` }}
          >
            Accepted: {metrics.signalsAccepted}
          </div>
          <div
            className="rejected"
            style={{ width: `${(metrics.signalsRejected / metrics.signalsGenerated) * 100}%` }}
          >
            Rejected: {metrics.signalsRejected}
          </div>
        </div>
      </div>

      <div className="last-updated">
        Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, warning }: any) {
  return (
    <div className={`metric-card ${warning ? 'warning' : ''}`}>
      <div className="icon">{icon}</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="value">{value}</div>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
```

### Step 4.4: Production Checklist

**Before Going Live:**

- [ ] All database tables created and indexed
- [ ] Cron trigger configured (every 1 minute)
- [ ] Bot Durable Objects deployed and tested
- [ ] Trade queue processing working
- [ ] Rate limiter integrated (or mocked safely)
- [ ] Monitoring dashboard live
- [ ] Alert system configured (future: Sentry, PagerDuty)
- [ ] Paper trading tested end-to-end (10+ bots, 24 hours)
- [ ] Single live bot tested (small position size)
- [ ] Rollback plan documented
- [ ] On-call rotation established

**Production Deployment:**

```bash
# 1. Deploy to production
npx wrangler deploy --env production

# 2. Enable 1 test bot
npx wrangler d1 execute botbox-production --command "
UPDATE bots SET status = 'ACTIVE' WHERE id = 'test-bot-001';
"

# 3. Monitor for 24 hours
npx wrangler tail --env production

# 4. Gradually enable more bots (5 at a time)
npx wrangler d1 execute botbox-production --command "
UPDATE bots SET status = 'ACTIVE' WHERE id IN ('bot-002', 'bot-003', 'bot-004', 'bot-005', 'bot-006');
"

# 5. Monitor metrics endpoint
curl https://your-worker.workers.dev/metrics
```

## Troubleshooting Guide

### Issue: No signals generated

**Symptoms:** Cron runs, but signals table empty

**Diagnosis:**
1. Check if bots are ACTIVE: `SELECT * FROM bots WHERE status = 'ACTIVE';`
2. Check last_check_at not too recent: `SELECT id, name, last_check_at FROM bots;`
3. Check market data fetch not failing: Review Worker logs for errors

**Fix:**
- Ensure bot status is 'ACTIVE'
- Verify check_interval_minutes is reasonable (1-15)
- Fix market data integration if failing

### Issue: All signals rejected

**Symptoms:** Signals logged but all decision = 'REJECTED'

**Diagnosis:**
1. Check rejection reasons: `SELECT rejection_reason, COUNT(*) FROM signals WHERE decision = 'REJECTED' GROUP BY rejection_reason;`
2. Most common: "Max positions reached" → Increase max position limit
3. Second most common: "Duplicate position" → Check position tracking

**Fix:**
- Adjust risk limits (max positions, correlation limits)
- Verify position manager correctly tracking closes
- Review strategy entry conditions (too aggressive?)

### Issue: Trades not executing

**Symptoms:** Signals accepted, but trade_queue stuck in PENDING

**Diagnosis:**
1. Check queue: `SELECT * FROM trade_queue WHERE status = 'PENDING';`
2. Check queue processor logs: Look for rate limit errors
3. Check order executor integration: Verify FT-010 working

**Fix:**
- Ensure queue processor running in cron (after signal generation)
- Verify rate limiter not blocking all requests
- Test order executor directly (unit test)

### Issue: Duplicate orders

**Symptoms:** Same signal creates 2 orders on exchange

**Diagnosis:**
1. Check trade_queue for duplicates: `SELECT bot_id, asset, direction, COUNT(*) FROM trade_queue GROUP BY bot_id, asset, direction HAVING COUNT(*) > 1;`
2. Check signal hash deduplication
3. Check bot last_check_at not being updated

**Fix:**
- Add unique constraint on trade_queue (bot_id, asset, direction, status='PENDING')
- Ensure last_check_at updated atomically
- Add orderLinkId deduplication in order executor

### Issue: Worker timeouts

**Symptoms:** Cron logs show 30-second timeouts, incomplete execution

**Diagnosis:**
1. Check number of active bots: `SELECT COUNT(*) FROM bots WHERE status = 'ACTIVE';`
2. Too many bots (>100) may timeout in single cycle
3. Check Durable Object response times (should be <5s per bot)

**Fix:**
- Implement batching (process 100 bots/cycle, multiple cycles per minute)
- Optimize strategy evaluation (cache indicator calculations)
- Increase cron frequency (every 30 seconds instead of 1 minute)

## Performance Optimization Tips

### Tip 1: Cache Market Data

**Problem:** Fetching market data from exchange for every bot is slow and wasteful (10 bots trading BTC = 10 identical API calls).

**Solution:** Shared market data cache (KV or Durable Object)

```typescript
// Cache market data for 1 minute
const marketDataCache = new Map<string, { data: any; expiry: number }>();

async function fetchMarketData(asset: string): Promise<any> {
  const cached = marketDataCache.get(asset);
  if (cached && Date.now() < cached.expiry) {
    return cached.data; // Cache hit
  }

  // Cache miss, fetch from exchange
  const data = await exchangeAPI.getMarketData(asset);

  marketDataCache.set(asset, {
    data,
    expiry: Date.now() + 60000 // 1 minute TTL
  });

  return data;
}
```

**Impact:** Reduces exchange API calls by 90% (10 bots share 1 fetch)

### Tip 2: Pre-Calculate Indicators

**Problem:** Calculating RSI, EMA, Bollinger Bands on every signal check is CPU-intensive.

**Solution:** Pre-calculate common indicators, store in historical_data table

```sql
-- Add indicator columns to historical_data
ALTER TABLE historical_data ADD COLUMN rsi_14 REAL;
ALTER TABLE historical_data ADD COLUMN ema_20 REAL;
ALTER TABLE historical_data ADD COLUMN bb_upper REAL;
ALTER TABLE historical_data ADD COLUMN bb_lower REAL;

-- Update indicators once per new candle (not per bot)
-- Strategy evaluation just reads pre-calculated values
```

**Impact:** Strategy evaluation latency drops from 5s to <500ms

### Tip 3: Parallel Bot Processing

**Problem:** Sequential bot processing slow for 100+ bots.

**Solution:** Already implemented via Durable Objects (parallel by default)

**Verification:** Check Worker logs show multiple bots processing concurrently

```
[Bot BTC-Trend] Starting signal check
[Bot ETH-Mean-Rev] Starting signal check (simultaneous)
[Bot SOL-Grid] Starting signal check (simultaneous)
```

### Tip 4: Batch Database Writes

**Problem:** Individual INSERT statements for each signal slow.

**Solution:** Batch INSERT for signals logged in same cycle

```typescript
// Instead of 100 individual INSERTs
for (const signal of signals) {
  await db.prepare('INSERT INTO signals ...').bind(...).run();
}

// Use batch INSERT
await db.batch(
  signals.map(signal =>
    db.prepare('INSERT INTO signals ...').bind(...)
  )
);
```

**Impact:** Signal logging 10x faster (100ms → 10ms)

## Next Steps

**After successful deployment:**

1. **Integrate FT-090 Factor Library** (replace mock strategy evaluation)
2. **Integrate FT-091 Risk Management** (replace mock risk checks)
3. **Integrate FT-140 Regime Detection** (add regime validation)
4. **Add adaptive intervals** (faster checks during volatility)
5. **Implement multi-timeframe analysis** (check 1h + 4h together)
6. **Add A/B testing** (compare interval strategies)
7. **Scale to 500+ bots** (implement batching if needed)

## Support & Resources

**Documentation:**
- Cloudflare Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- D1 Database: https://developers.cloudflare.com/d1/

**Monitoring:**
- Cloudflare Dashboard: https://dash.cloudflare.com/
- Worker Logs: `npx wrangler tail`
- Metrics API: `https://your-worker.workers.dev/metrics`

**Team Contacts:**
- Architecture questions: @architect
- Deployment issues: @devops
- Signal evaluation bugs: @quant-dev

**On-Call Escalation:**
- Critical (trading halted): Page @team-lead immediately
- High (reduced capacity): Alert in #botbox-alerts Slack
- Medium (degraded performance): File GitHub issue
- Low (optimization): Add to backlog
