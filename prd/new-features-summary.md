# New Critical Features - Summary

**Date**: 2025-10-26
**Analysis**: Trading strategist review of feature gaps

## Three New Features Added

### 1. FT-012: Exchange Health Monitoring & Failover
**Priority**: P0 (Phase 1)
**Location**: `/prd/features/ft-012-exchange-health-failover/feature.md`

**Why Critical for Swing Trading:**
Exchange APIs degrade or fail during volatility. Without monitoring and failover, bots can't execute exits, trapping you in losing positions.

**Key Capabilities:**
- Real-time API latency and success rate tracking
- Auto-failover from Binance to ByBit when primary exchange fails
- Circuit breaker: pause bots if exchange unreachable for 5+ minutes
- Dashboard showing exchange health status (Healthy/Degraded/Down)

**User Impact:**
You'll never be stuck unable to close a position because Binance is down. Orders automatically route to ByBit as backup.

---

### 2. FT-140: Market Regime Detection
**Priority**: P1 (Phase 2)
**Location**: `/prd/features/ft-140-market-regime-detection/feature.md`

**Why Critical for Swing Trading:**
Mean-reversion strategies bleed money in trending markets. Trend-following strategies chop in ranging markets. You need to know which regime you're in and only trade when favorable.

**Key Capabilities:**
- Per-asset regime classification: Trending Up/Down, Ranging, High/Low Volatility
- Algorithm based on ADX (trend strength), DMI (direction), ATR (volatility)
- Auto-pause strategies when market regime is unfavorable
- Per-regime performance tracking: see which strategies work in which conditions
- Alerts when regime changes (e.g., "BTC entered high volatility, review strategies")

**User Impact:**
Your RSI mean-reversion bot auto-pauses when BTC starts trending, saving you from 10+ losing trades. Dashboard shows "This strategy: +12% in ranging, -8% in trending" so you know when to deploy it.

---

### 3. FT-145: Strategy Versioning & A/B Testing
**Priority**: P1 (Phase 2)
**Location**: `/prd/features/ft-145-strategy-versioning-ab-testing/feature.md`

**Why Critical for Iteration:**
You can't improve strategies without comparing versions systematically. Deploying untested parameter changes is gambling.

**Key Capabilities:**
- Immutable versioning: every strategy change creates new version (v1.2.0 → v1.3.0)
- A/B testing framework: run old vs new version side-by-side with equal capital
- Automated winner selection: promote v2 if Sharpe ratio >1.2x v1 after 50 trades
- Statistical significance testing: "95% confident v2 is better"
- Quick rollback: restore previous version in <2 minutes if new one fails
- Changelog tracking: "v1.3.0: RSI threshold 30 → 35, position size 2% → 1.5%"

**User Impact:**
Before deploying RSI threshold change from 30 to 35, you run both versions for 50 trades. Data shows v2 has 1.8 Sharpe vs 1.3 for v1. System auto-promotes v2. No guessing, pure data.

---

## Updated PRD Overview

The `prd/overview.md` has been updated to include these features in the roadmap:

**Phase 1 additions:**
- FT-012: Exchange Health & Failover

**Phase 2 additions:**
- FT-140: Market Regime Detection
- FT-145: Strategy Versioning & A/B Testing

---

## Implementation Priority

**Must-Have for MVP (Phase 1):**
1. FT-012: Exchange Health & Failover
   - Without this, exchange outages can trap you in positions

**High Priority Post-MVP (Phase 2):**
2. FT-140: Market Regime Detection
   - Prevents deploying wrong strategy for current market conditions

3. FT-145: Strategy Versioning & A/B Testing
   - Enables safe, data-driven strategy iteration

---

## What We're NOT Building

Based on your feedback, these were rejected as unnecessary for swing trading:

- ❌ Webhook receiver (not using TradingView webhooks)
- ❌ Slippage monitoring (not scalping, volatility not a concern)
- ❌ Funding rate arbitrage (too complex for v1)
- ❌ Tax lot accounting (not applicable in Belarus)
- ❌ WebSocket real-time data (REST polling sufficient)
- ❌ TWAP/VWAP order splitting (position sizes too small)

---

## Next Steps

1. Review the three new feature specs
2. Prioritize which to build first (recommend FT-012 in Phase 1)
3. Add to your implementation backlog
4. Consider how FT-140 integrates with existing FT-090 (Strategy Development)
