# US-003: Signal Generation Dashboard

**Feature:** FT-085 Signal Generation & Trade Orchestration
**Story ID:** US-003
**Priority:** P1 (High)
**Approved:** false

## Story

**As a** trader,
**I want** to see real-time signal generation activity on a dashboard,
**So that** I know my bots are working and can monitor system health.

## Acceptance Criteria

### AC1: Dashboard Widget
- [ ] Shows: Active bots count, signals generated (last hour), trades executed
- [ ] Updates every 30 seconds (live data)
- [ ] Visual indicator: Green (healthy), Yellow (degraded), Red (down)

### AC2: Per-Bot Status
- [ ] Last check time, next check time
- [ ] Recent signals (last 10)
- [ ] Signal generation rate chart (last 24h)

### AC3: System Health
- [ ] Queue depth (pending trades)
- [ ] Exchange API status
- [ ] Error rate (last hour)
- [ ] Alert indicators

## Definition of Done

- [ ] Dashboard component implemented (React)
- [ ] Real-time updates via WebSocket or polling
- [ ] Deployed to staging and production
- [ ] User testing completed
