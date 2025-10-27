# US-002: Trade Execution from Signals

**Feature:** FT-085 Signal Generation & Trade Orchestration
**Story ID:** US-002
**Priority:** P0 (Critical)
**Approved:** false

## Story

**As a** trader,
**I want** my bot to automatically execute trades when it generates a valid signal,
**So that** I capture trading opportunities immediately without manual intervention.

## Acceptance Criteria

### AC1: Signal to Trade Pipeline
- [ ] Valid signal → queued for execution within 5 seconds
- [ ] Trade executes via FT-010 (Order Execution Engine)
- [ ] Order confirmation received from exchange
- [ ] Position created in FT-080 (Position Management)

### AC2: Performance Requirements
- [ ] 95th percentile: Signal → Order submitted < 30 seconds
- [ ] 99th percentile: Signal → Order filled < 60 seconds
- [ ] Success rate: >99% (excluding exchange rejections)

### AC3: Deduplication
- [ ] Duplicate signals (same bot, asset, direction within 5 min) rejected
- [ ] Signal hash used for deduplication
- [ ] Exchange orderLinkId prevents duplicate orders
- [ ] Alert on duplicate detection

### AC4: Position Tracking
- [ ] Position created immediately after order placement
- [ ] Position status: PENDING → FILLED
- [ ] Stop loss and take profit orders placed
- [ ] Economics tracked (FT-110)

## Definition of Done

- [ ] Code implemented
- [ ] Tests pass (unit + integration)
- [ ] Zero duplicate orders in 1000 signal test
- [ ] Deployed and validated in production
