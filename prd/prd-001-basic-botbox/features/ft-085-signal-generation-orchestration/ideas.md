# FT-085: Signal Generation & Orchestration - Initial Ideas

## Problem Discovery

**Date:** 2025-10-27
**Context:** User was reviewing trading strategy implementations and asked fundamental questions

### The Questions That Revealed the Gap

**User Question 1:**
> "How will we get signals? We're not subscribing to any feeds."

**User Question 2:**
> "Are we going to periodically poll our backend (bots) and make them check for suitable trades in line with their strategy (if enabled)?"

**User Question 3:**
> "I think we might be missing a feature describing exactly the starting of trades, the conditions."

### Initial Realization

These questions exposed a critical architectural blind spot:
- We had strategies defined (FT-090)
- We had bots configured (FT-100)
- We had execution engines (FT-010, FT-070)
- We had position tracking (FT-080)

**But we had ZERO mechanism to actually trigger any of it!**

The system was like a car with an engine, wheels, and fuel, but no ignition system. It literally couldn't start.

## Brainstorming Session

### Idea 1: WebSocket Event Streams

**Concept:** Subscribe to exchange price feeds, evaluate strategy on every price update

**Pros:**
- Real-time (lowest latency)
- Event-driven (reactive)

**Cons:**
- Strategies need full evaluation, not just price updates
- Would trigger 1000x per hour for no reason (4H strategy doesn't need second-by-second checks)
- Incompatible with serverless (need long-running connections)
- Very expensive at scale

**Verdict:** ❌ Rejected (overkill, wrong pattern for swing trading)

---

### Idea 2: Database Polling

**Concept:** Background worker polls database every N seconds for bot configurations

**Pros:**
- Simple to understand
- Works with traditional infrastructure

**Cons:**
- Requires persistent worker process
- Not serverless-compatible
- Database becomes bottleneck
- No natural distribution mechanism

**Verdict:** ❌ Rejected (doesn't fit Cloudflare serverless architecture)

---

### Idea 3: Cloudflare Cron Triggers + Durable Objects

**Concept:** Scheduled cron triggers orchestrate signal generation, Durable Objects provide bot isolation

**Pros:**
- Serverless-native (fits Cloudflare architecture)
- Cost-effective ($0.15/month for 100 bots)
- Matches strategy timeframes (5-min polling sufficient for 4H strategies)
- Automatic scaling
- Strong consistency via Durable Objects

**Cons:**
- Latency: 1-5 min delay vs real-time
- Learning curve (new Cloudflare patterns)

**Verdict:** ✅ ACCEPTED (best fit for requirements + architecture)

---

### Idea 4: Queue-Based Architecture

**Concept:** Cron pushes "check signal" messages to queue, consumer workers process

**Pros:**
- Decouples trigger from execution
- Good for high throughput (>10k signals/hour)
- Built-in retry logic

**Cons:**
- Overkill for current scale (600-6000 signals/hour)
- More expensive than Durable Objects at current scale
- Added complexity

**Verdict:** 🔄 Deferred (migrate to this if scale > 10k signals/hour)

---

## Key Insights

### Insight 1: Polling is Not a Dirty Word

**Traditional wisdom:** "Event-driven > Polling"

**Reality for trading bots:**
- 4H strategy evaluating every 5 minutes = 99.9% opportunity capture
- 4H strategy evaluating every second = 99.9% opportunity capture + 300x cost
- **Conclusion:** Polling interval should match strategy timeframe

**Decision:** Embrace polling as the right pattern for swing trading

---

### Insight 2: Serverless Requires Different Patterns

**Traditional bot architecture:**
```
Long-running process → While loop → Check conditions every N seconds
```

**Serverless architecture:**
```
Scheduled trigger → Spawn ephemeral workers → Complete and terminate
```

**Learning:** Can't just "port" traditional patterns. Need to rethink orchestration for serverless.

---

### Insight 3: Feature Gaps Can Be Invisible

**How the gap went unnoticed:**
1. Each feature seemed complete in isolation
2. FT-070 had "execute trade" ✓
3. FT-090 had "evaluate strategy" ✓
4. But nothing connected them!

**Lesson:** Always trace end-to-end flows, not just individual features

**Action Item:** Add "E2E Flow Review" as mandatory step in feature approval

---

## Early Technical Explorations

### Exploration 1: Cloudflare Cron Limits

**Research Question:** Can Cloudflare Cron handle our scale?

**Findings:**
- Free: Up to 3 cron triggers per Worker
- Max frequency: Every 1 minute (for free tier)
- Worker execution: 30 seconds CPU time limit
- Durable Objects: No execution time limit (can run longer)

**Implication:**
- 1-minute cron sufficient (strategies check every 1-5 min)
- Must complete orchestration in <30s (batching if >500 bots)
- Heavy lifting (strategy evaluation) happens in Durable Objects (no time limit)

---

### Exploration 2: Rate Limiting Strategy

**Research Question:** How do we prevent exchange API bans?

**Options:**
1. Per-bot local rate limiting (simple, but no global visibility)
2. Centralized rate limiter (complex, but safe)

**Decision:** Centralized Rate Limiter Durable Object

**Rationale:**
- Exchange ban = $10k+ loss + weeks of recovery
- Centralized visibility critical (100 bots could exceed limits individually)
- Use 80% of published limit (safety buffer)
- Cost of complexity << Cost of API ban

---

### Exploration 3: Deduplication Strategy

**Research Question:** How do we prevent duplicate orders?

**Identified risks:**
1. Same cron fires twice (Cloudflare bug)
2. Race condition (two Workers process same bot)
3. User manually triggers + cron fires
4. Exchange retries on network failure

**Multi-layer defense:**
1. **Layer 1:** Queue check (is trade already queued?)
2. **Layer 2:** Durable Object locking (optimistic concurrency)
3. **Layer 3:** Signal hash deduplication
4. **Layer 4:** Exchange orderLinkId (exchange-level dedup)

**Decision:** Implement all 4 layers (defense in depth)

---

## Alternative Architectures Considered

### Alternative 1: AWS Lambda + EventBridge

**Why considered:** Mature, well-documented

**Why rejected:**
- 30% more expensive
- Higher cold start latency
- Requires leaving Cloudflare ecosystem
- More complex deployment

---

### Alternative 2: Self-Hosted VPS + Cron

**Why considered:** Full control, traditional pattern

**Why rejected:**
- 136% more expensive ($20/month VPS vs $0.15/month Cloudflare)
- Operational overhead (maintenance, monitoring, scaling)
- Defeats serverless architecture goal
- No automatic scaling

---

### Alternative 3: Cloudflare Workers + Queue API

**Why considered:** Cloudflare-native, better for high throughput

**Why rejected (for MVP):**
- Overkill for 600-6000 signals/hour
- More expensive than Durable Objects at current scale
- Can migrate later if needed (not a one-way door)

**Future consideration:** Migrate if scale > 10k signals/hour

---

## Open Questions (Now Resolved)

### Q1: How often should bots check for signals?

**Initial uncertainty:** Every second? Every minute? Every hour?

**Resolution:** Depends on strategy timeframe
- 4H strategy: Every 5 minutes
- 1H strategy: Every 1 minute
- 15-minute strategy: Every 30 seconds

**Key insight:** Polling interval should be 1-5% of strategy timeframe

---

### Q2: How do we coordinate 100+ bots without conflicts?

**Initial uncertainty:** Shared state? Message queue? Leader election?

**Resolution:** Durable Objects (one per bot)
- Strong consistency (no race conditions)
- Isolated state (no coordination needed)
- Automatic distribution

**Key insight:** Durable Objects = distributed state machines

---

### Q3: What if signal evaluation takes > 30 seconds?

**Initial uncertainty:** Will Workers timeout?

**Resolution:**
- Orchestrator (Worker): Lightweight, completes in <10s
- Strategy evaluation (Durable Object): No time limit, can run longer
- Set 10-second timeout per bot evaluation (fail fast)

**Key insight:** Separate orchestration (fast) from evaluation (potentially slow)

---

## Evolution of the Solution

### Version 1: Naive Approach (Rejected)

```
Every minute:
  For each bot:
    Fetch market data
    Evaluate strategy
    If signal: Execute trade
```

**Problem:** Sequential execution = 100 bots * 5 seconds = 8+ minutes (misses interval)

---

### Version 2: Parallel Execution (Considered)

```
Every minute:
  Fetch all bots
  Execute Promise.all(bots.map(evaluateSignal))
```

**Problem:** No isolation, race conditions, all bots share Worker state

---

### Version 3: Durable Objects (Accepted)

```
Every minute:
  Fetch all bots
  For each bot:
    Get Durable Object
    Fire & forget evaluation
  Durable Objects run in parallel, isolated
```

**Advantage:** Isolation + parallelism + consistency

---

## Implementation Philosophy

### Principle 1: Start Simple, Scale Later

**Approach:**
- Phase 1: Implement for 10 bots (prove concept)
- Phase 2: Scale to 100 bots (validate performance)
- Phase 3: Optimize for 1000+ bots (only if needed)

**Rationale:** Don't over-engineer for scale we don't have yet

---

### Principle 2: Defense in Depth

**Approach:**
- Multiple deduplication layers
- Circuit breakers + retries
- Rate limiting + backoff
- Monitoring + alerts

**Rationale:** Trading systems need 99.9%+ reliability

---

### Principle 3: Fail Fast, Fail Safe

**Approach:**
- 10-second timeout per bot evaluation
- Dead letter queue for failed signals
- Alert on repeated failures
- Graceful degradation (pause bot, don't crash system)

**Rationale:** One bad strategy shouldn't take down entire system

---

## Next Steps (Post-Approval)

1. Review this ideas doc with user
2. Validate architecture decisions
3. Move to architecture.md (formalize decisions)
4. Create spec.md (implementation details)
5. Begin Phase 1 implementation (paper trading)

---

## Reflections

### What Went Well

- User's intuition to ask "how do signals get generated?" was spot-on
- Architect agent caught the gap immediately
- Cloudflare Cron + Durable Objects pattern emerged as clear winner
- Comprehensive documentation created before any code

### What Could Be Improved

- Gap should have been caught during initial feature planning
- Need better end-to-end flow validation
- Should have created sequence diagrams earlier

### Lessons for Future Features

- Always ask: "Who triggers this? When? How?"
- Trace complete data flow before declaring feature "done"
- Don't assume "obvious" features exist (they often don't)
- Add E2E flow review to feature approval checklist
