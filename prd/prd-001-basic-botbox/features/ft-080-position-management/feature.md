title: Position Management
feature-id: FT-080
prd: prd-001-crypto-trading-automation
status: draft
priority: P0 (MVP blocker - must track what's open)
estimated-effort: 40 hours

## Problem

A trading bot without position tracking is flying blind. You can't answer basic operational questions:
- Do I have any open positions right now?
- What's my entry price on this BTC long?
- How long has this position been open?
- Is this position profitable or underwater?
- Can I open another position, or am I at my limit?
- Did my stop-loss get hit, or is the position still open?

Without accurate position tracking, you risk:
- **Over-trading**: Opening duplicate positions when you think you're flat
- **Missed exits**: Not knowing when a position should close per strategy rules
- **Risk miscalculation**: Thinking you have 2 positions when you actually have 5
- **Reconciliation failures**: Bot state disagrees with exchange state

Professional algo traders treat position management as the single source of truth. Every entry, every exit, every P&L calculation depends on knowing exactly what's open and what's closed.

## Goals

- Track all open positions in real-time across all bots
- Know entry price, current price, unrealized P&L for each position
- Detect when positions should close based on strategy rules or time limits
- Reconcile bot-tracked positions with exchange-reported positions daily
- Prevent duplicate position entries (already long BTC, can't open another)
- Support both spot positions (owns BTC) and futures positions (long/short contracts)
- Maintain historical record of all closed positions for performance analysis
- Alert when positions are "stuck" open beyond expected duration

## User Value

**Safety**: Never accidentally open 3 BTC positions when you meant to have 1
**Clarity**: At any moment, see exactly what you own and what it's worth
**Performance**: Calculate P&L accurately from precise entry/exit tracking
**Debugging**: When a trade goes wrong, full position lifecycle is logged
**Compliance**: Complete audit trail of every position for tax and reporting

## Success Metrics

- Position list updates within 1 second of exchange fill confirmation
- Zero discrepancies between bot positions and exchange positions (daily reconciliation)
- Unrealized P&L accurate to within 0.1% of exchange mark price
- Position queries return in <100ms (fast enough for real-time decision making)
- Detect and alert on stuck positions within 1 hour of expected close time
- Historical position data retained for 2+ years for tax reporting

## Scope

### In Scope
- Track open positions for spot and futures
- Record entry timestamp, entry price, quantity, direction (long/short)
- Calculate unrealized P&L using current market price
- Detect position close conditions:
  - Strategy signals exit
  - Stop-loss hit
  - Take-profit hit
  - Time-based exit (position open >7 days)
- Position lifecycle states: Opening → Open → Closing → Closed
- Link positions to bot ID and strategy version (know which bot opened this)
- Reconciliation with exchange positions (query exchange, compare with internal state)
- Alert on position anomalies:
  - Position open >7 days (zombie position)
  - Unrealized loss exceeds -10% (high drawdown warning)
  - Exchange shows position bot doesn't know about (sync issue)
- Support partial closes (close 50% of position, keep 50% open)
- Historical position archive (closed positions preserved indefinitely)

### Out of Scope (Future Phases)
- Portfolio-level position aggregation (combining BTC position across multiple bots)
- Hedging logic (open offsetting positions to reduce risk)
- Position transfer between bots (move position from Bot A to Bot B)
- Options or complex derivatives (focus on spot and linear futures only)
- Cross-exchange position netting (each exchange tracked independently)
- Real-time streaming position updates (poll every 5 seconds is sufficient for MVP)

## Position Lifecycle

### State 1: Opening (Transitional)

**Trigger**: Strategy generates entry signal

**Actions**:
- Create position record with status "Opening"
- Record: Bot ID, strategy version, asset, direction, intended quantity, signal time
- Submit order to exchange via Order Execution Engine (FT-110)
- Wait for fill confirmation

**Next State**:
- If order fills → "Open"
- If order fails/rejected → Delete position record, log error
- If partial fill → "Open" with actual filled quantity (not intended quantity)

### State 2: Open (Active)

**Trigger**: Order fill confirmed by exchange

**Actions**:
- Update position status to "Open"
- Record: Actual entry price, actual quantity, entry timestamp, order ID
- Start tracking unrealized P&L (current price - entry price) × quantity
- Monitor exit conditions every 5 seconds:
  - Strategy signals exit
  - Stop-loss price hit
  - Take-profit price hit
  - Time-based exit (position age >7 days)

**Next State**:
- If any exit condition met → "Closing"
- If manual close requested → "Closing"
- If bot paused → Position stays "Open", no new exits triggered

### State 3: Closing (Transitional)

**Trigger**: Exit condition detected or manual close

**Actions**:
- Update position status to "Closing"
- Record: Exit reason, signal time
- Submit close order to exchange via Order Execution Engine (FT-110)
- Wait for fill confirmation

**Next State**:
- If order fills → "Closed"
- If order fails → Retry up to 3 times, then alert user
- If partial close → Update position quantity, return to "Open" for remaining

### State 4: Closed (Final)

**Trigger**: Close order fill confirmed by exchange

**Actions**:
- Update position status to "Closed"
- Record: Exit price, exit timestamp, exit reason, realized P&L
- Calculate final metrics:
  - Realized P&L: (Exit price - Entry price) × Quantity - Fees
  - Hold duration: Exit timestamp - Entry timestamp
  - Return %: (Exit price - Entry price) / Entry price × 100
- Archive position to historical positions table
- Notify Economics Tracking (FT-060) to update realized P&L
- Remove from active positions list

**Next State**: None (terminal state)

## Position Data Model

Every position contains:

### Core Identification
- Position ID (UUID)
- Bot ID (which bot opened this)
- Strategy name and version (e.g., "RSI Mean Reversion v1.2")
- Exchange (ByBit, Binance)
- Environment (Production, Testnet, Paper Trading)

### Asset Information
- Symbol (BTC/USDT, ETH/USDT)
- Market type (Spot or Futures)
- Direction (Long or Short)

### Entry Details
- Entry timestamp (when position opened)
- Entry price (actual fill price)
- Entry quantity (actual filled amount, may differ from intended)
- Entry order ID (exchange order reference)
- Entry fees paid
- Entry reason (which indicator triggered: "RSI <30", "MACD crossover")

### Current State
- Status (Opening, Open, Closing, Closed)
- Current price (mark price from exchange, updated every 5 seconds)
- Unrealized P&L (for open positions)
- Position age (hours since entry)
- Last update timestamp

### Exit Planning (for Open positions)
- Stop-loss price (where to exit if losing)
- Take-profit price (where to exit if winning)
- Trailing stop distance (if using trailing stops)
- Time-based exit deadline (e.g., close after 48 hours)

### Exit Details (for Closed positions)
- Exit timestamp
- Exit price
- Exit quantity (may be partial close)
- Exit order ID
- Exit fees paid
- Exit reason ("Stop-loss hit", "Take-profit hit", "Strategy signal", "Time limit")
- Realized P&L (final profit/loss after fees)
- Return % (percentage gain/loss)
- Hold duration (hours from entry to exit)

## Position Types and Rules

### Spot Positions (Long Only)

**What it is**: You own the actual asset (bought BTC, now holding it)

**Entry**:
- Buy BTC/USDT on spot market
- Asset moves from USDT balance to BTC balance
- No leverage, no funding fees
- No expiration

**Exit**:
- Sell BTC/USDT on spot market
- Asset moves from BTC balance to USDT balance

**Rules**:
- Can only be long (can't short on spot)
- Must have sufficient USDT balance to buy
- No margin requirements
- No liquidation risk

**Use case**: Long positions per your cost-optimization strategy (avoid funding fees)

### Futures Positions (Long or Short)

**What it is**: Contract representing BTC price movement without owning BTC

**Entry**:
- Open long or short position on futures market
- Uses margin (collateral), not full position value
- Charged funding rate every 8 hours
- Can use 1-2x leverage per your requirements

**Exit**:
- Close position (market or limit order)
- Funding fees deducted from P&L

**Rules**:
- Can be long or short
- Must have sufficient margin balance
- Funding rate costs accumulate over time
- Liquidation risk if price moves against you (manageable with 1-2x leverage)

**Use case**: Short positions (required, can't short on spot) and leveraged longs if desired

## Position Opening Rules

### Pre-Entry Validation Checklist

Before opening position, verify:

1. **No duplicate position exists**
   - Check: Is there already an open position for this symbol + direction + bot?
   - If yes: Reject new entry, log warning "Already long BTC via Bot-001"

2. **Bot is active**
   - Check: Bot status = "Active" (not Paused, Draft, or Archived)
   - If not: Reject entry

3. **Sufficient balance**
   - Spot: USDT balance ≥ (Quantity × Price + Fees)
   - Futures: Margin balance ≥ Initial margin requirement
   - If not: Reject entry, alert "Insufficient balance"

4. **Risk limits not exceeded**
   - Check: Current open positions < Max concurrent positions (from FT-090)
   - Check: Total portfolio risk < Max portfolio heat (from FT-090)
   - If violated: Reject entry, log "Risk limit reached"

5. **Instrument on whitelist**
   - Check: Symbol exists in bot's allowed instruments list
   - If not: Reject entry, alert "BTC/USDT not whitelisted for this bot"

6. **Exchange connectivity**
   - Check: Exchange API responding within 3 seconds
   - If not: Reject entry, retry after 10 seconds

### Position Creation Flow

1. Strategy generates entry signal
2. Position Manager validates (checklist above)
3. If valid:
   - Create position record (status: "Opening")
   - Calculate position size based on risk parameters (FT-090)
   - Submit order to Order Execution Engine (FT-110)
4. Wait for fill confirmation (up to 30 seconds)
5. On fill:
   - Update position record (status: "Open", actual entry price/quantity)
   - Start monitoring exit conditions
6. On failure:
   - Delete position record
   - Log error for debugging

## Position Closing Rules

### Exit Condition Detection

Monitor every 5 seconds for:

**1. Stop-Loss Hit**
- Current price ≤ Stop-loss price (for longs)
- Current price ≥ Stop-loss price (for shorts)
- Action: Immediately trigger close order

**2. Take-Profit Hit**
- Current price ≥ Take-profit price (for longs)
- Current price ≤ Take-profit price (for shorts)
- Action: Immediately trigger close order

**3. Strategy Signal Exit**
- Strategy generates exit signal (e.g., "RSI >70" for long)
- Action: Trigger close order within 1 minute

**4. Time-Based Exit**
- Position age >7 days (168 hours)
- Action: Trigger close order, log "Time limit exit"
- Why 7 days: Prevents "zombie positions" that never close

**5. Manual Close**
- User clicks "Close Position" in UI
- Action: Trigger close order immediately

**6. Bot Paused**
- Bot status changes to "Paused"
- Action: Do NOT auto-close existing positions
- Positions remain open, managed manually or until bot resumed

### Position Close Flow

1. Exit condition detected
2. Position Manager validates:
   - Position still exists on exchange
   - Exchange API responding
3. Submit close order to Order Execution Engine (FT-110)
4. Wait for fill confirmation (up to 30 seconds)
5. On fill:
   - Update position record (status: "Closed")
   - Calculate realized P&L
   - Archive to historical positions
   - Notify Economics Tracking (FT-060)
6. On failure:
   - Retry up to 3 times (with exponential backoff: 5s, 15s, 45s)
   - If all retries fail: Alert user "Failed to close BTC position, manual intervention required"

## Reconciliation with Exchange

### Daily Reconciliation Process

**Purpose**: Ensure bot's internal position state matches exchange reality

**Frequency**: Every 24 hours at 00:00 UTC

**Process**:

1. Query exchange for all open positions via API
2. Compare with bot's internal "Open" positions
3. Detect discrepancies:
   - **Bot shows position, exchange doesn't**: Position was closed externally
   - **Exchange shows position, bot doesn't**: Position opened externally or sync failed
   - **Quantities differ**: Partial close occurred externally
4. For each discrepancy:
   - Log detailed error report
   - Alert user via monitoring system (FT-010)
   - Create reconciliation task for manual review

**Auto-Resolution Rules**:

- If position exists on exchange but not in bot:
  - Import position into bot tracking (status: "Open", entry price from exchange history)
  - Log: "Reconciliation: Imported externally opened BTC position"

- If position exists in bot but not on exchange:
  - Mark position as "Closed" in bot
  - Calculate P&L based on last known price
  - Log: "Reconciliation: Closed position missing from exchange"

- If quantities differ:
  - Update bot position quantity to match exchange
  - Calculate partial P&L for closed portion
  - Log: "Reconciliation: Adjusted BTC position quantity from 0.1 to 0.05"

### Real-Time Sync (Every 5 Seconds)

For open positions only:
- Query current market price from exchange
- Update unrealized P&L
- Check exit conditions
- Update position age

## User Stories

### US-001: View All Open Positions
**As a** trader monitoring my bots
**I want to** see all currently open positions across all bots
**So that I** know my current exposure and risk

**Acceptance Criteria**:
- Navigate to "Positions" page
- See table with columns: Symbol, Direction, Bot, Entry Price, Current Price, Unrealized P&L, Age, Actions
- Positions sorted by age (oldest first)
- Green row for profitable positions, red for losing
- Click position to view detailed position history
- Refresh updates positions within 1 second

### US-002: Track Unrealized P&L
**As a** trader with open positions
**I want to** see real-time unrealized P&L for each position
**So that I** know if I'm currently winning or losing

**Acceptance Criteria**:
- Unrealized P&L updates every 5 seconds
- Shows both $ amount and % return
- Example: "+$125 (+2.5%)" for winning position
- Example: "-$80 (-1.6%)" for losing position
- Total unrealized P&L summed at top of page
- Color-coded: Green if positive, red if negative

### US-003: Manually Close Position
**As a** trader who wants to exit early
**I want to** manually close a position before strategy signals exit
**So that I** can lock in profits or cut losses at my discretion

**Acceptance Criteria**:
- Click "Close Position" button on position row
- Confirmation modal: "Close 0.05 BTC long at market price? Estimated P&L: +$125"
- Click "Confirm"
- Position status changes to "Closing"
- Close order submitted to exchange
- Within 30 seconds, position status changes to "Closed"
- Realized P&L recorded and visible in closed positions list

### US-004: Identify Stuck Positions
**As a** risk-conscious trader
**I want to** be alerted when positions are open longer than expected
**So that I** can investigate why they haven't closed

**Acceptance Criteria**:
- Position open for >7 days triggers alert
- Alert message: "BTC long via Bot-RSI-v1 has been open for 8 days (expected max 7)"
- Alert shown in monitoring dashboard (FT-010)
- Position highlighted in yellow on positions page
- Click position to see entry reason and current strategy state
- Option to manually close or extend time limit

### US-005: View Position History
**As a** trader analyzing performance
**I want to** see all closed positions with their P&L
**So that I** can understand which trades were winners and losers

**Acceptance Criteria**:
- Navigate to "Position History" page
- See table with closed positions: Symbol, Direction, Bot, Entry Date, Exit Date, Hold Time, Entry Price, Exit Price, Realized P&L, Exit Reason
- Filter by: Date range, bot, symbol, profitable/unprofitable
- Sort by any column
- Export to CSV for external analysis
- Total realized P&L summed at top

### US-006: Detect Position Entry Failures
**As a** trader expecting a position to open
**I want to** be notified when entry fails
**So that I** can investigate and fix the issue

**Acceptance Criteria**:
- Strategy signals "Enter long BTC"
- Position Manager attempts to open position
- Entry fails due to insufficient balance
- Alert immediately: "Failed to open BTC long via Bot-RSI-v1: Insufficient USDT balance (need $5,200, have $5,000)"
- Position record not created (stays in "Opening" state with error logged)
- User sees alert in monitoring dashboard
- Can click alert to view full error details

### US-007: Reconcile Positions with Exchange
**As a** paranoid trader
**I want to** verify bot positions match exchange positions
**So that I** trust the bot's position tracking

**Acceptance Criteria**:
- Navigate to "Position Reconciliation" page
- Click "Run Reconciliation Now" button
- System queries exchange for all open positions
- Compares with bot's internal positions
- Shows results:
  - ✅ "All positions match (3 positions)"
  - ❌ "2 discrepancies found"
- If discrepancies:
  - Show side-by-side comparison: Bot shows X, Exchange shows Y
  - Option to "Sync from Exchange" (update bot to match exchange)
  - Option to "Investigate" (manual review)

### US-008: Partial Position Close
**As a** trader managing risk
**I want to** close half a position to lock in profits while letting rest run
**So that I** reduce risk while keeping upside potential

**Acceptance Criteria**:
- Open position: 0.1 BTC long
- Click "Partial Close" button
- Enter quantity: 0.05 BTC (50%)
- Confirm partial close
- Close order submitted for 0.05 BTC
- Position updated: Quantity now 0.05 BTC (remaining)
- Partial P&L calculated and recorded
- Remaining 0.05 BTC continues tracking with same entry price
- Can close remainder later (either via strategy signal or manual)

## Acceptance Criteria (System-Level)

- Position list query returns all open positions in <100ms
- Unrealized P&L calculation accurate to within 0.1% of exchange mark price
- Position state updates within 1 second of exchange order fill
- Reconciliation detects and alerts on discrepancies within 5 minutes
- Stuck position alerts trigger within 1 hour of 7-day threshold
- Historical position data retained for minimum 2 years
- Position close orders execute within 30 seconds (95th percentile)
- Zero positions lost or duplicated (100% data integrity)
- Supports concurrent position updates (multiple bots opening/closing simultaneously)

## Position Query Patterns

**Most Common Queries** (optimize for speed):

1. "Show all open positions" → <100ms
2. "Is there an open BTC long?" → <50ms (decision-critical)
3. "What's total unrealized P&L?" → <100ms
4. "Which positions are >5 days old?" → <200ms
5. "Show all closed positions for Bot-RSI-v1 in last 30 days" → <500ms

## Error Handling

### Position Opening Errors

**Error**: Insufficient balance
- Action: Reject entry, alert user, suggest reducing position size

**Error**: Duplicate position detected
- Action: Reject entry, log warning, alert user

**Error**: Exchange API timeout
- Action: Retry 3 times, if fail → reject entry and alert

**Error**: Order rejected by exchange (invalid quantity, price limits)
- Action: Log full error details, alert user with exchange message

### Position Closing Errors

**Error**: Exchange API timeout during close
- Action: Retry exponentially (5s, 15s, 45s), if all fail → escalate to user

**Error**: Insufficient balance to close (futures margin issue)
- Action: Alert user "Cannot close position, margin issue", require manual intervention

**Error**: Position not found on exchange (closed externally)
- Action: Mark as closed in bot, calculate P&L from last known price, flag for reconciliation

## Dependencies

- Order Execution Engine (FT-110) to submit entry/exit orders
- Risk Controls (FT-090) to validate position limits before entry
- Economics Tracking (FT-060) to receive realized P&L updates
- Exchange Connectivity (FT-020) to query current positions and prices
- Strategy Development (FT-130) to receive entry/exit signals
- Bot Management (FT-040) to link positions to specific bots

## Risks & Mitigations

**Risk: Bot and Exchange State Diverge**
- Scenario: Bot thinks position is open, exchange shows closed
- Mitigation: Daily reconciliation, real-time sync every 5s, alert on discrepancy

**Risk: Position Stuck Open Forever**
- Scenario: Strategy never signals exit, position ages indefinitely
- Mitigation: 7-day time-based exit override, alert at 7 days

**Risk: Duplicate Position Created**
- Scenario: Race condition causes two entry orders for same signal
- Mitigation: Pre-entry check for existing position, order deduplication by orderLinkId

**Risk: Partial Fill Confusion**
- Scenario: Order for 0.1 BTC only fills 0.06 BTC, bot confused about quantity
- Mitigation: Always use actual filled quantity from exchange, not intended quantity

**Risk: Manual Trading Breaks Bot State**
- Scenario: User manually closes position on exchange, bot doesn't know
- Mitigation: Reconciliation process imports external changes, alerts user

## Open Questions

- Should positions automatically close when bot is paused, or remain open?
  - **Recommendation**: Remain open (safer, prevents forced exits during maintenance)

- How to handle positions during bot strategy version upgrade?
  - **Recommendation**: Existing positions managed by old version until closed, new entries use new version

- Should system prevent opening position in opposite direction (long BTC when already short)?
  - **Recommendation**: Yes for MVP, warn user "Opening long will offset existing short"

- What to do with positions when bot is deleted?
  - **Recommendation**: Prevent deletion if open positions exist, force close or transfer first

## Related Features

- FT-090: Risk Controls (validates position limits before opening)
- FT-110: Order Execution Engine (executes position entry/exit orders)
- FT-060: Economics Tracking (receives realized P&L from closed positions)
- FT-130: Strategy Development (generates entry/exit signals)
- FT-040: Bot Management (positions linked to bot configurations)
- FT-020: Exchange Connectivity (queries position state from exchange)
- FT-010: Monitoring & Alerts (alerts on stuck positions, reconciliation failures)
