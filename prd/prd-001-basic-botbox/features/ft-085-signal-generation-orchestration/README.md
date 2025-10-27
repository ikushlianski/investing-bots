# FT-085: Signal Generation & Trade Orchestration

**Status:** Proposed (Critical Gap)
**Priority:** P0 (Absolute Blocker)
**Phase:** Foundation

## Quick Summary

This feature solves the **critical missing piece** in the trading system: the orchestration layer that actually makes bots check for trades and execute them automatically.

**Without FT-085:** Bots sit idle forever. System is completely non-functional for live trading.

**With FT-085:** Bots automatically evaluate strategies every 1-5 minutes, generate signals, and execute trades 24/7 without manual intervention.

## Problem Statement

The user discovered a fundamental gap while asking:
> "How will we get signals? We're not subscribing to any feeds. Are we going to periodically poll our backend (bots)?"

**The Gap:** We had strategies, bots, execution engines, and position tracking, but **zero mechanism to trigger any of it**.

## Solution: Cloudflare Cron Triggers + Durable Objects

```
Cloudflare Cron (every 1-5 min)
    ↓
Orchestrator Worker (fetch active bots)
    ↓
Bot Durable Objects (parallel evaluation)
    ↓
Signal Generation → Validation → Trade Queue
    ↓
Order Execution (FT-010)
```

**Cost:** ~$0.15/month for 100 bots
**Latency:** <30 seconds from signal → trade
**Uptime:** 99.9%

## Document Structure

### Core Documents (Read in Order)

1. **[ideas.md](./ideas.md)** - Initial brainstorming, problem discovery, rejected alternatives
2. **[discussion.md](./discussion.md)** - Design decisions, trade-offs, risks, implementation plan
3. **[architecture.md](./architecture.md)** - Technical architecture, components, data flow
4. **[spec.md](./spec.md)** - Implementation guide, code examples, deployment steps
5. **[feature.md](./feature.md)** - Complete feature specification (50+ pages)

### User Stories

- **[US-001: Automated Signal Generation](./US001-automated-signal-generation/)** - Bots check conditions automatically every N minutes (P0)
- **[US-002: Trade Execution from Signals](./US002-trade-execution-from-signals/)** - Signals automatically execute trades (P0)
- **[US-003: Signal Generation Dashboard](./US003-signal-generation-dashboard/)** - Real-time monitoring of signal activity (P1)
- **[US-004: Manual Signal Trigger](./US004-manual-signal-trigger/)** - "Check Now" button for testing (P2)
- **[US-005: Pause Signal Generation](./US005-pause-signal-generation/)** - Emergency pause all bots (P1)

## Key Decisions

### Decision 1: Polling (Not Event-Driven)

**Why:** 4H strategies don't need sub-second updates. 5-minute polling captures 99.9% of opportunities for 300x less cost.

### Decision 2: Durable Objects (Not Shared Workers)

**Why:** Strong consistency critical for trading (no duplicate orders). $0.15/month cost negligible vs risk of race conditions.

### Decision 3: Centralized Rate Limiter

**Why:** Exchange API ban = $10k+ loss. Centralized control prevents exceeding limits across 100+ bots.

## Implementation Phases

### Phase 1: Paper Trading (Week 1-2)
- Implement orchestration without live trades
- Prove signal generation works
- Validate logging to FT-061

### Phase 2: Live Trading (Week 3-4)
- Enable trade execution
- Start with 1 bot, $100 position
- Scale to 10 bots

### Phase 3: Production (Week 5-6)
- Scale to 100 bots
- Add monitoring dashboards
- Run 24/7 without intervention

## Performance Targets

| Metric | Target |
|--------|--------|
| Signal evaluation latency | <5 seconds |
| Orchestration cycle (100 bots) | <10 seconds |
| Trade execution latency | <30 seconds |
| Duplicate signal rate | 0% |
| Uptime | >99.9% |

## Dependencies

**Blocks Implementation:**
- FT-001: Cloudflare infrastructure
- FT-010: Order execution
- FT-080: Position management
- FT-090: Strategy framework
- FT-100: Bot management

**Enhances Functionality:**
- FT-061: Signal tracking
- FT-091: Risk management
- FT-140: Market regime detection

## Quick Start (for Developers)

1. Read [ideas.md](./ideas.md) - Understand the problem and why this solution
2. Read [discussion.md](./discussion.md) - Understand trade-offs and decisions
3. Read [architecture.md](./architecture.md) - Understand technical design
4. Read [spec.md](./spec.md) - Follow implementation guide
5. Start with US-001 (Automated Signal Generation)

## Risks & Mitigations

### Risk: Exchange API Ban
**Mitigation:** Rate limiter (80% safety buffer) + circuit breaker + monitoring

### Risk: Duplicate Orders
**Mitigation:** 4-layer deduplication (queue, locking, hash, orderLinkId)

### Risk: Worker Timeouts
**Mitigation:** Parallel execution (<10s for 100 bots) + batching for 500+ bots

## Approvals Required

- [ ] Architecture approved (Cloudflare Cron + Durable Objects)
- [ ] Cost model approved (~$0.15/month + trading fees)
- [ ] Performance targets approved
- [ ] Risk mitigations approved
- [ ] Implementation phases approved

## Contact

**Feature Owner:** Architect Agent
**Created:** 2025-10-27
**Status:** Awaiting User Approval

---

**Next:** Review ideas.md → discussion.md → architecture.md, then approve to begin implementation.
