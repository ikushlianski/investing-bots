# BotBox Version 0 - Complete Implementation Plan

## Executive Summary

This is the complete, detailed implementation plan for BotBox Version 0 - a fully automated cryptocurrency trading bot targeting various setups, designed to initially run on Bybit testnet.

**Goal**: Build an MVP trading bot that detects setups, requires manual approval via visual charts, executes trades, and runs stably for 1 week.

**Timeline**: 4 weeks (assumes AI-assisted development, ~15 minutes per task)

**Success Criteria**:

- Bot detects 5+ valid trading setups
- You approve and complete 3-5 full trades
- System runs stable for 1 week without crashes
- You understand every decision the bot makes

---

## Your Choices & Configuration

### Exchange & Capital

- **Exchange**: Bybit Testnet
- **Capital**: $10,000 testnet USDT
- **Instruments**: 10 pairs (BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOGE, DOT, MATIC)

### Strategy

- **Strategy**: ST-002 Bollinger Band Mean Reversion
- **Timeframes**: 1H (entry), 4H (regime filter), 1D, 1W (context)
- **Regime Filter**: ATR-based proxy for ADX (RANGING when ATR < 0.7× average)
- **Setup Types**: Lower BB Bounce (long), Upper BB Rejection (short)

### Risk Management

- **Risk per Trade**: 1% ($100 per trade)
- **Max Position Size**: 10% of account ($1,000 max notional)
- **Max Open Positions**: 8 concurrent trades
- **Stop Loss**: BB extreme ± 1.5× ATR
- **Take Profits**: TP1 at BB middle (70% position), TP2 at opposite BB (30%)

### Infrastructure

- **Database**: Neon PostgreSQL with TimescaleDB (500 MB free tier)
- **Backend**: Cloudflare Workers (serverless, cron every 5 minutes)
- **Frontend**: TanStack Start (React 19) + TradingView Lightweight Charts
- **Indicators Library**: `technicalindicators` npm package

### Data

- **Historical Backfill**: 2 years across all timeframes (~227,000 candles, ~100 MB)
- **Indicators**: Bollinger Bands (20, 2), RSI (14), ATR (14), Volume MA (20)

### Execution

- **Mode**: Automated cron + manual approval
- **Approval Method**: Web dashboard with TradingView charts
- **Response Time Target**: Within 1-2 hours of setup detection

---

## Implementation Phases

### Phase 1: Database Setup & Migration (Week 1, Days 1-2)

**File**: `01-database-setup.md`

- Set up Neon PostgreSQL project
- Enable TimescaleDB extension
- Configure Cloudflare Hyperdrive
- Migrate schemas from D1 to PostgreSQL
- Create candles hypertable
- Seed 10 instruments
- Create job logs table

**Time**: 4-6 hours across 12 tasks

---

### Phase 2: Historical Data Backfill (Week 1, Days 3-4)

**File**: `02-data-backfill.md`

- Install Bybit SDK
- Build market data fetcher
- Create candle persistence module
- Build backfill orchestrator
- Execute 2-year backfill (~20-30 mins runtime)
- Verify data quality
- Set up candle recording cron
- Test recording logic

**Time**: 3-4 hours across 9 tasks

---

### Phase 3: Indicator Calculation Engine (Week 1, Days 5-7)

**File**: `03-indicator-calculation.md`

- Install `technicalindicators` library
- Build indicator calculator service
- Create indicators update repository
- Backfill indicators for all candles (~20-30 mins runtime)
- Verify indicator calculations
- Integrate into candle recorder
- Test real-time updates

**Time**: 3-4 hours across 8 tasks

---

### Phase 4: Trading Logic - ST-002 (Week 2, Days 1-4)

**File**: `04-trading-logic.md`

- Create market regime detector (ATR-based)
- Build setup scanner (Lower BB Bounce + Upper BB Rejection)
- Create setups database schema
- Build setup persistence repository
- Create risk calculator
- Implement setup invalidation logic
- Build trading loop orchestrator
- Test full flow

**Time**: 6-8 hours across 8 tasks

---

### Phase 5: Approval Dashboard (Week 3, Days 1-5)

**File**: `05-approval-dashboard.md`

- Install TradingView Lightweight Charts
- Create pending setups API
- Create candles data API
- Create approve/reject API
- Build TradingChart component
- Build SetupDetailsCard component
- Create approval dashboard page
- Add navigation

**Time**: 8-10 hours across 8 tasks

---

### Phase 6: Trade Execution & Monitoring (Week 3, Days 6-7)

**File**: `06-trade-execution.md`

- Update Bybit adapter for spot trading
- Create trade executor service
- Integrate execution into approval flow
- Build order monitor service
- Add monitoring to cron job
- Create trades dashboard API
- Test execution flow

**Time**: 4-6 hours across 7 tasks

---

### Phase 7: Deployment & Live Testing (Week 4+)

**File**: `07-deployment.md`

- Configure production secrets
- Deploy to Cloudflare Workers
- Verify cron trigger
- Create operational runbook
- Build monitoring dashboard
- Run 1-week live test
- Evaluate success criteria

**Time**: Variable (mostly waiting/monitoring)

---

## Tech Stack Summary

### Frontend

- **Framework**: TanStack Start (React 19)
- **Router**: TanStack Router (file-based)
- **Styling**: Tailwind CSS 4.0
- **Charts**: TradingView Lightweight Charts
- **Icons**: Lucide React

### Backend

- **Runtime**: Cloudflare Workers (serverless)
- **Database**: Neon PostgreSQL 17 + TimescaleDB
- **ORM**: Drizzle ORM
- **Scheduler**: Cloudflare Cron (every 5 minutes)

### Trading

- **Exchange SDK**: Bybit API (via bybit-api npm)
- **Indicators**: technicalindicators npm package
- **Existing Adapters**: BybitAdapter (already implemented in codebase)

### Development

- **Language**: TypeScript
- **Build**: Vite
- **Test**: Vitest
- **Deploy**: Wrangler CLI

---

## File Structure

```
/investing-tool
├── apps/
│   └── botbox/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── index.tsx                    (home dashboard)
│       │   │   ├── approvals.tsx                (approval page)
│       │   │   └── api/
│       │   │       ├── setups/
│       │   │       │   ├── pending.ts
│       │   │       │   └── $id/
│       │   │       │       ├── approve.ts
│       │   │       │       └── reject.ts
│       │   │       ├── candles/$symbol/$timeframe.ts
│       │   │       └── trades/index.ts
│       │   ├── components/
│       │   │   ├── trading-chart.tsx
│       │   │   └── setup-details-card.tsx
│       │   ├── db/
│       │   │   ├── connection.ts
│       │   │   ├── candles-repository.ts
│       │   │   ├── indicators-repository.ts
│       │   │   └── setups-repository.ts
│       │   ├── services/
│       │   │   ├── bybit-market-data.ts
│       │   │   ├── candle-recorder.ts
│       │   │   └── indicator-calculator.ts
│       │   ├── trading/
│       │   │   ├── regime-detector.ts
│       │   │   ├── setup-scanner.ts
│       │   │   ├── risk-calculator.ts
│       │   │   ├── setup-invalidator.ts
│       │   │   ├── trade-executor.ts
│       │   │   ├── order-monitor.ts
│       │   │   └── trading-loop.ts
│       │   └── scheduled.ts                     (cron handler)
│       ├── scripts/
│       │   ├── test-connection.ts
│       │   ├── seed-instruments.ts
│       │   ├── backfill-candles.ts
│       │   ├── verify-candles.ts
│       │   ├── backfill-indicators.ts
│       │   ├── verify-indicators.ts
│       │   ├── test-candle-recording.ts
│       │   ├── test-trading-loop.ts
│       │   └── test-trade-execution.ts
│       ├── wrangler.jsonc
│       └── drizzle.config.ts
├── packages/
│   └── core/
│       └── src/
│           └── exchanges/
│               └── bybit-adapter.ts             (already exists)
├── docs/
│   └── runbook.md
├── logs/
│   ├── week1-day1.md
│   └── week1-review.md
└── prd/
    └── prd-000-botbox-toddler/
        ├── 00-overview.md                       (this file)
        ├── 01-database-setup.md
        ├── 02-data-backfill.md
        ├── 03-indicator-calculation.md
        ├── 04-trading-logic.md
        ├── 05-approval-dashboard.md
        ├── 06-trade-execution.md
        └── 07-deployment.md
```

---

## Key Decisions & Rationale

### Why Neon over D1?

- TimescaleDB for efficient timeseries queries
- 500 MB free tier (plenty for 100 MB of data)
- Better performance for candle data
- Single database solution (no split architecture)

### Why ATR instead of ADX?

- Faster to implement
- Good enough proxy for ranging markets
- Can upgrade to real ADX in Version 1.0

### Why manual approval?

- Safety: you review every trade before execution
- Learning: understand bot's decision-making
- Confidence: build trust in system before full automation

### Why testnet first?

- Zero financial risk
- Test all integrations
- Validate strategy logic
- Build operational experience

### Why 1% risk per trade?

- Conservative position sizing
- Survives 20+ consecutive losses
- Industry standard for retail traders
- Allows for learning without blowing up account

---

## Dependencies & Accounts Needed

### External Services

1. **Neon** (https://neon.tech)

   - Free tier account
   - 500 MB database
   - No credit card required

2. **Cloudflare Workers** (https://workers.cloudflare.com)

   - Free tier: 100,000 requests/day
   - Cron triggers included
   - May need account verification

3. **Bybit Testnet** (https://testnet.bybit.com)
   - Free test account
   - Unlimited testnet USDT
   - API keys with spot trading enabled

### Development Environment

- Node.js 18+ (for scripts)
- npm / pnpm (package manager)
- Git (version control)
- Code editor (VS Code recommended)

### Optional but Recommended

- Neon CLI (for local DB access)
- Wrangler CLI (for deployments)
- Postman (for API testing)

---

## Cost Breakdown (All Free Tier)

- **Neon Database**: $0/month (free tier, 500 MB)
- **Cloudflare Workers**: $0/month (free tier, <100k requests/day)
- **Bybit Testnet**: $0/month (unlimited virtual funds)
- **Domain** (optional): $0-12/year (use workers.dev subdomain or buy custom)

**Total Monthly Cost: $0**

---

## Risk Disclosure

Even though this is testnet (fake money):

1. **Not financial advice**: This bot is for educational purposes
2. **Past performance ≠ future results**: Backtests may not reflect live trading
3. **Testnet ≠ real money**: Slippage, fees, emotions differ in live trading
4. **Market conditions change**: Strategy may stop working
5. **Bugs happen**: Software may have errors despite testing
6. **You are responsible**: Only trade what you can afford to lose

**Before going live with real money**:

- Complete Version 0 successfully
- Run comprehensive backtest (Version 0.5)
- Start with tiny capital ($500-1000)
- Keep manual approval enabled
- Monitor closely for first 10 trades

---

## Next Steps

1. **Start with Phase 1**: Open `01-database-setup.md`
2. **Work sequentially**: Complete each task before moving to next
3. **Test frequently**: Use provided test scripts after each phase
4. **Document issues**: Keep notes in logs/ folder
5. **Ask questions**: If stuck, refer to docs or ask for help

**When ready to begin:**

```bash
cd investing-tool
cd apps/botbox
npm install
# Then follow 01-database-setup.md
```

---

## Success Path

```
Version 0 (testnet) → Backtest (Version 0.5) → Tiny capital live (Version 0.6) → Full capital (Version 1.0)
        ↓                      ↓                           ↓                              ↓
  3-5 trades           Win rate >55%              10 successful trades          Scale to full strategy
  Stable 1 week        Drawdown <20%              Manual approval              Multiple strategies
                       Sharpe >1.0                                             Automated execution
```

---

## Support Resources

- **Trading Strategy Docs**: `/prd/strategies/st-002-bollinger-band-mean-reversion.md`
- **Main PRD**: `/prd/overview.md`
- **Codebase Docs**: `/prd/prd-001-basic-botbox/`
- **Neon Docs**: https://neon.tech/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers
- **TradingView Charts**: https://tradingview.github.io/lightweight-charts
- **Bybit API**: https://bybit-exchange.github.io/docs/v5/intro

---

**Ready to build your trading bot? Start with Phase 1!**
