# US-005: Pause Signal Generation

**Feature:** FT-085 Signal Generation & Trade Orchestration
**Story ID:** US-005
**Priority:** P1 (High)
**Approved:** false

## Story

**As a** trader,
**I want** to pause signal generation for all bots during periods of high volatility or uncertainty,
**So that** I can avoid trading in unfavorable market conditions.

## Acceptance Criteria

### AC1: Global Pause Control
- [ ] "Pause All Bots" button on main dashboard
- [ ] Confirmation dialog: "This will pause signal generation for all 45 active bots. Continue?"
- [ ] Stops signal generation immediately (next cron cycle)

### AC2: Pause Behavior
- [ ] No new signals generated while paused
- [ ] Existing open positions remain active (not auto-closed)
- [ ] Stop loss and take profit orders still monitored
- [ ] Bot status changes to "PAUSED"

### AC3: Resume Functionality
- [ ] "Resume All Bots" button
- [ ] Auto-resume after configurable timeout (optional)
- [ ] Manual resume restores signal generation immediately

### AC4: Per-Bot Pause
- [ ] Individual bots can be paused independently
- [ ] Pause reason: Manual, Regime Change (FT-140), Max Drawdown (FT-091)
- [ ] Pause log entry in audit trail (FT-020)

## Definition of Done

- [ ] Pause/resume controls implemented
- [ ] Bot status management updated
- [ ] Paused bots skip signal checks
- [ ] Existing positions monitored regardless of pause
- [ ] Deployed and tested with 50 bots
