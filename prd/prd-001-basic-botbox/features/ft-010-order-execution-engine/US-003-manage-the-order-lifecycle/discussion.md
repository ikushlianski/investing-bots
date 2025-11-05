---
resolved: false
updated: 2025-10-31
---

# Discussion: US-003 - Manage the Order Lifecycle

## Context

This user story requires implementing an OrderExecutionEngine that handles the complete order lifecycle from placement through completion, including partial fills, retries, and error handling. Based on Bybit API research, we have detailed information about their order execution model.

## Key Bybit API Findings

### Order States
Bybit provides the following order statuses:
- `Created` - Order created but not yet active
- `New` - Order placed and active
- `PartiallyFilled` - Order partially executed
- `Filled` - Order fully executed
- `Cancelled` - Order cancelled
- `PendingCancel` - Order is being cancelled
- `Rejected` - Order rejected
- `Deactivated` - Conditional order deactivated

### Partial Fill Tracking
Bybit provides comprehensive fields for tracking partial execution:
- `cumExecQty` - Cumulative executed quantity
- `cumExecValue` - Cumulative executed value in quote currency
- `cumExecFee` - Total fees paid
- `leavesQty` - Remaining quantity not yet executed
- `leavesValue` - Remaining value not yet executed
- `avgPrice` - Average fill price across all executions

### Real-time Updates
- WebSocket subscription to `order` topic provides real-time order updates
- Each update includes full order state with all execution details
- Updates fire on status changes, partial fills, and completions

## Design Questions

### 1. Order State Tracking

**Question:** How should we model order states internally?

**Options:**
- [ ] Mirror Bybit states exactly (`Created`, `New`, `PartiallyFilled`, `Filled`, `Cancelled`, `Rejected`)
- [ ] Simplify to user story states (`pending`, `filled`, `partially_filled`, `failed`, `canceled`)
- [ ] Hybrid approach: map Bybit states to simplified internal states

**Considerations:**
- User story acceptance criteria specifies: `pending`, `filled`, `partially_filled`, `failed`, `canceled`
- We may support multiple exchanges in future, so exchange-agnostic states are valuable
- However, we need to preserve enough detail for debugging and auditing

**Recommendation:**

### 2. Partial Fill Handling

**Question:** When an order is partially filled, should we:

**Options:**
- [ ] Wait for complete fill and track cumulative data internally
- [ ] Notify PositionManager immediately on each partial fill
- [ ] Batch partial fills and notify PositionManager on intervals (e.g., every 5 seconds)

**Considerations:**
- User story states: "must correctly handle partial fills, updating the PositionManager with the actual filled quantity"
- Market orders typically fill quickly, but limit orders can have multiple partial fills over time
- Each PositionManager update may trigger risk calculations and logging
- WebSocket updates are real-time, so we could update on every fill

**Recommendation:**

### 3. Retry Logic - Transient vs Permanent Errors

**Question:** How do we distinguish transient errors (should retry) from permanent errors (should fail immediately)?

**Options:**
- [ ] Hardcode list of retriable Bybit error codes
- [ ] Use HTTP status codes (5xx = retry, 4xx = permanent)
- [ ] Hybrid: HTTP status + specific error codes from response body
- [ ] Configurable retry policy with allowlist/denylist

**Considerations:**
- Network timeouts are clearly transient
- "Insufficient funds" should not retry (permanent)
- "Invalid symbol" should not retry (permanent)
- "Exchange temporarily unavailable" should retry (transient)
- Exchange rate limits should trigger backoff, not immediate failure

**Recommendation:**

### 4. Retry Configuration

**Question:** What should our retry policy parameters be?

**Current user story requirement:** "retry up to 3 times with exponential backoff"

**Needs clarification:**
- [ ] Initial backoff delay (e.g., 1 second, 2 seconds?)
- [ ] Backoff multiplier (e.g., 2x, 3x?)
- [ ] Maximum backoff delay (e.g., cap at 30 seconds?)
- [ ] Should retries reset if order state changes (e.g., partial fill)?

**Recommendation:**

### 5. Order Monitoring Strategy

**Question:** How should we monitor order status after submission?

**Options:**
- [ ] WebSocket only - subscribe to order updates
- [ ] Polling only - query order status at intervals
- [ ] Hybrid - WebSocket with polling fallback
- [ ] WebSocket with periodic reconciliation polls

**Considerations:**
- WebSocket provides real-time updates with minimal API calls
- WebSocket connections can disconnect and require reconnection logic
- Polling is more resilient but burns rate limit budget
- Critical for detecting partial fills and completion

**Recommendation:**

### 6. Failed Order Alerting

**Question:** How should we implement "critical alerts" for permanent failures?

**Options:**
- [ ] Log to error logging service (e.g., Sentry, Cloudflare Logpush)
- [ ] Send webhook to external monitoring system
- [ ] Store in database with `critical` flag for operator dashboard
- [ ] Multiple channels (log + store + notify)

**Considerations:**
- User story states: "must immediately send a critical alert"
- Need to define what "immediately" means (synchronous, async queue?)
- Should alerts include order details, error reason, account context?
- How do operators acknowledge/resolve alerts?

**Recommendation:**

### 7. Order ID Management

**Question:** Should we use Bybit's orderId or our own orderLinkId for tracking?

**Options:**
- [ ] Use Bybit's `orderId` as primary identifier
- [ ] Use our own `orderLinkId` as primary identifier
- [ ] Track both, use `orderLinkId` internally and `orderId` for API calls

**Considerations:**
- `orderId` is assigned by Bybit after successful submission
- `orderLinkId` we control, can set before submission
- Need idempotency for retry logic (orderLinkId helps here)
- Multiple exchanges may have different ID schemes

**Recommendation:**

### 8. Order Execution Flow

**Question:** What should be the detailed flow when `placeOrder` is called?

**Needs definition:**
- [ ] Validate order parameters (symbol, quantity, side, type)
- [ ] Check rate limiter before submission
- [ ] Submit order to exchange via adapter
- [ ] Store order in local state/database
- [ ] Start monitoring (WebSocket subscription or polling)
- [ ] Handle success/failure responses
- [ ] Implement retry logic for failures
- [ ] Update PositionManager on fills

**Recommendation:**

### 9. Order Cancellation

**Question:** Do we need order cancellation in this user story?

**Considerations:**
- User story doesn't explicitly mention cancellation
- Bybit API supports cancellation (only for unfilled/partially filled orders)
- May be needed for:
  - User-initiated cancels
  - Risk management (stop trading in emergency)
  - Replacing stale limit orders
- Could defer to future user story

**Recommendation:**

### 10. Testing Strategy

**Question:** How should we test order lifecycle without burning real funds?

**Options:**
- [ ] Use Bybit testnet for integration tests
- [ ] Mock exchange adapter responses in unit tests
- [ ] Record/replay actual API responses
- [ ] All of the above

**Considerations:**
- Need to test partial fills, retries, failures
- Testnet may have different behavior than production
- Need confidence before deploying to production

**Recommendation:**

## Next Steps

Once these questions are resolved, I will draft the architecture.md document with the technical design for the OrderExecutionEngine component.
