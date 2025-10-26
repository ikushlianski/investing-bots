title: FT-010 Bot Health Monitoring & Alerts
feature-id: ft-010
status: planned
priority: P0 (CRITICAL)
phase: 1

## Overview

Real-time bot health monitoring with email notifications for failures, errors, and critical events. This is the foundational feature that ensures bots are running correctly and alerts the user immediately when something goes wrong.

## Problem Statement

Trading bots are fragile, especially in their first weeks of operation. Silent failures can result in:
- Missed trading opportunities (webhook not processed, bot offline)
- Unmanaged risk (bot stuck in a position, can't place stop-loss)
- Capital loss (API errors preventing exits, balance drained unexpectedly)
- No visibility into bot health until manually checking

**Without monitoring, you're flying blind.** You need to know immediately when something breaks.

## Goals

**Primary Goal**: Never miss a critical bot failure

**Success Metrics**:
- Alert delivery: <30 seconds from error to email notification
- False positive rate: <5% (avoid alert fatigue)
- Detection coverage: 100% of critical failures (API down, bot crashed, webhook missed)
- Dashboard availability: 99%+ uptime
- Zero silent failures: Every error is logged and surfaced

## User Stories

### US-001: Real-Time Bot Status Dashboard
**As a trader**, I want to see the current status of all my bots at a glance, so I know if everything is running correctly without checking logs.

**Acceptance Criteria**:
- Dashboard shows all bots with current status: Active, Paused, Error, Disconnected
- Last signal timestamp for each bot (e.g., "Last signal: 5 minutes ago")
- Last successful trade timestamp
- Current positions (if any)
- API connection status (Binance, ByBit)
- Refresh every 10 seconds automatically

### US-002: Email Notifications for Critical Errors
**As a trader**, I want to receive email notifications immediately when a bot fails, so I can take corrective action before losing money.

**Acceptance Criteria**:
- Email sent within 30 seconds of error detection
- Email includes: bot name, error type, timestamp, suggested action
- Configurable alert thresholds per bot
- Alert categories: Critical (immediate), Warning (review soon), Info (FYI)
- No duplicate alerts (same error doesn't spam inbox)

### US-003: Health Check System
**As a trader**, I want to automated health checks running continuously, so failures are detected even when I'm not watching.

**Acceptance Criteria**:
- Check every 60 seconds: API connectivity, last signal time, balance status
- Alert if no signal received in X hours (configurable per bot)
- Alert if API connection fails
- Alert if unexpected balance drop (>10% in <1 hour)
- Alert if bot hasn't traded in X days (configurable)

### US-004: Configurable Alert Thresholds
**As a trader**, I want to customize alert thresholds per bot, so I'm only notified about events that matter for that specific strategy.

**Acceptance Criteria**:
- Per-bot settings: max time between signals, max allowed drawdown, min required balance
- Different thresholds for different bot types (scalper vs swing trader)
- Ability to mute alerts temporarily (e.g., during maintenance)
- Alert history: see past alerts and when they were resolved

## Technical Requirements

### Health Check Logic

**Bot Status States**:
- **Active**: Receiving signals, placing trades, API connected
- **Paused**: Manually paused by user, no trading
- **Error**: Critical failure (API down, execution failing)
- **Disconnected**: Can't reach exchange API
- **Idle**: No signals received but everything working (normal for low-frequency strategies)

**Health Checks to Implement**:

1. **Signal Freshness Check**
   - Track last signal timestamp per bot
   - Alert if `now - last_signal > threshold` (e.g., 4 hours for active bots)
   - Don't alert for bots marked as low-frequency

2. **API Connectivity Check**
   - Ping exchange APIs every 60 seconds
   - Alert if 3 consecutive ping failures
   - Track API rate limit headroom

3. **Balance Monitoring**
   - Query account balance every 5 minutes
   - Alert if balance drops >10% in <1 hour (unexpected loss)
   - Alert if balance drops below minimum threshold

4. **Execution Health**
   - Track order placement success rate
   - Alert if >20% of orders fail in last 10 attempts
   - Track fill rate (orders placed vs filled)

5. **Webhook Delivery**
   - Expect webhooks based on TradingView alert frequency
   - Alert if webhook delivery stops (none received in 2x expected interval)

### Email Notification System

**Requirements**:
- Use Cloudflare Email Workers or external service (SendGrid, AWS SES)
- Email template: plain text + HTML
- Rate limiting: max 1 email per error type per 5 minutes (prevent spam)
- Batch similar errors: "3 API failures in last 5 minutes" not 3 separate emails

**Email Content Template**:
```
Subject: [CRITICAL] Bot "Scalper-BTC" - API Connection Failed

Bot: Scalper-BTC
Status: Error - Disconnected
Timestamp: 2025-10-25 18:15:32 UTC

Error Details:
- API: Binance REST API
- Error: Connection timeout after 10s
- Retry attempts: 3 (all failed)
- Last successful API call: 18:10:15 UTC

Suggested Actions:
1. Check Binance API status: https://binance.com/status
2. Verify API credentials are valid
3. Check bot logs: [link to dashboard]

Auto-retry: Enabled (will retry every 60s)
```

### Dashboard UI Requirements

**Layout**:
- Bot list: card view with status badge, name, last activity
- Status indicators: color-coded (green, yellow, red)
- Quick actions: pause/resume bot, view logs, view positions
- Global overview: total bots, active bots, errored bots

**Bot Card Components**:
- Bot name + description
- Status badge (with icon and color)
- Last signal: "5 min ago" (relative time)
- Last trade: "2 hours ago"
- Current position: "Long BTC/USDT @ $67,500" or "No position"
- Quick stats: Win rate, P&L today, Total P&L
- Alert count: "3 warnings, 0 errors"

### Alert Threshold Configuration

**Configurable Per Bot**:
```typescript
interface AlertThresholds {
  max_signal_gap_hours: number        // Alert if no signal in X hours
  max_drawdown_percent: number        // Alert if P&L drops X% from peak
  min_balance_usd: number             // Alert if balance < X
  max_consecutive_losses: number      // Alert after X losing trades in a row
  api_failure_threshold: number       // Alert after X API failures
  enabled_alerts: {
    api_errors: boolean
    execution_errors: boolean
    balance_alerts: boolean
    signal_gaps: boolean
    performance_degradation: boolean
  }
}
```

## Data Model

### Bot Status Record
```typescript
interface BotStatus {
  bot_id: string
  status: 'active' | 'paused' | 'error' | 'disconnected' | 'idle'
  last_signal_at: Date
  last_trade_at: Date
  last_health_check_at: Date
  api_connection_status: {
    binance: 'connected' | 'disconnected' | 'error'
    bybit: 'connected' | 'disconnected' | 'error'
  }
  current_position: Position | null
  alert_count: {
    critical: number
    warning: number
    info: number
  }
}
```

### Alert Record
```typescript
interface Alert {
  id: string
  bot_id: string
  severity: 'critical' | 'warning' | 'info'
  type: 'api_error' | 'signal_gap' | 'balance_drop' | 'execution_error'
  message: string
  timestamp: Date
  resolved_at: Date | null
  notified_at: Date | null
  notification_method: 'email' | 'none'
}
```

## Implementation Notes

### Phase 1 Scope (MVP)
Build the absolute minimum to catch critical failures:
- Dashboard showing bot status (Active/Error)
- Email notifications for API failures
- Basic health check: last signal time
- Simple threshold: alert if no signal in 4 hours

### Phase 2 Enhancements
- Advanced health checks (balance monitoring, execution rate)
- Configurable thresholds per bot
- Alert history and resolution tracking
- Mute/unmute alerts

### Phase 3 Advanced
- Slack/Discord integration (FT-120)
- SMS notifications for critical errors
- Predictive alerts (e.g., "API response time degrading, failure imminent")
- Alert analytics (most common failures, MTTR)

## Testing Strategy

**Critical Test Cases**:
1. Simulate API failure → verify email sent within 30s
2. Stop sending webhooks → verify signal gap alert after threshold
3. Manually crash bot → verify status changes to "error"
4. Disconnect network → verify API disconnection detected
5. Send 10 rapid failures → verify email batching (not 10 emails)

**Performance Tests**:
- Dashboard loads in <1s with 10 bots
- Health checks complete in <5s per bot
- Alert email delivery: <30s from trigger to inbox

## Dependencies

**Upstream**:
- None (this is the first feature)

**Downstream**:
- FT-020 Exchange Connectivity (API status monitoring)
- FT-030 Webhook Receiver (webhook delivery monitoring)
- FT-040 Bot Management (bot lifecycle states)

## Risks & Mitigations

**Risk: Alert fatigue from false positives**
- Mitigation: Conservative thresholds initially, tunable per bot
- Mitigation: Batch similar alerts, rate limit emails

**Risk: Email delivery delays (not in our control)**
- Mitigation: Also surface alerts in dashboard
- Mitigation: Track alert delivery success rate
- Mitigation: Consider backup notification channel (SMS for critical)

**Risk: Health checks themselves failing silently**
- Mitigation: Meta-monitoring: alert if health check system hasn't run in 5 minutes
- Mitigation: Health check heartbeat logged

**Risk: Over-alerting during normal bot inactivity**
- Mitigation: Different thresholds for different bot strategies
- Mitigation: Ability to mark bot as "low frequency expected"

## Open Questions

1. Should we use a 3rd-party email service (SendGrid, AWS SES) or Cloudflare Email Workers?
   - Consideration: Cloudflare has sending limits, 3rd-party more reliable but costs money

2. What's the right default threshold for "signal gap" alerts?
   - Depends on strategy frequency (scalper vs swing trader)
   - Start with 4 hours, make configurable

3. Should critical alerts wake you up at night (SMS) or just email?
   - Phase 1: Email only
   - Phase 2: Optional SMS for user-defined critical events

4. How to handle temporary API outages (exchange maintenance)?
   - Option 1: Manual mute alerts during known maintenance
   - Option 2: Auto-detect "all bots failing" = likely exchange issue, reduce alert noise

## Success Criteria

**Feature is successful if**:
- Zero silent failures (every bot error is detected and alerted)
- Alert delivery: <30s from error to notification
- False positive rate: <10% (later optimize to <5%)
- User checks dashboard daily (engagement indicator)
- User reports feeling "safe" to leave bots running unsupervised

**Metrics to Track**:
- Time to detection (error occurs → alert sent)
- Alert delivery rate (% of alerts successfully sent)
- False positive rate (alerts that required no action)
- User response time (alert sent → user takes action)
- MTTR (mean time to resolution for errors)
