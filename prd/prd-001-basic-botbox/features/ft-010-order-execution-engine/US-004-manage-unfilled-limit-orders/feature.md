# US-004: Manage Unfilled Limit Orders

## User Story

As a trading strategy developer, I want to define a time-in-force for limit orders so that unfilled orders are automatically cancelled after a specified duration, preventing stale orders from executing at a disadvantageous time.

## Acceptance Criteria

1.  **Order ID from Exchange:** When a limit order is placed, the system must capture and store the unique order identifier returned by the exchange.
2.  **Strategy-Defined Timeout:** Each trading strategy must be able to specify a timeout period (e.g., in seconds or minutes) for its limit orders. This could be a property of the signal or the strategy configuration.
3.  **Order Status Monitoring:** The system must monitor the status of open limit orders.
4.  **Automatic Cancellation:** If a limit order is not filled within the specified timeout period, the system must automatically cancel the order on the exchange.
5.  **State Update:** Upon successful cancellation, the order's status in the system should be updated to "cancelled" or "expired".
6.  **Logging:** The cancellation of an unfilled order due to a timeout should be logged for audit and debugging purposes.

## Notes

*   This feature is crucial for strategies that are sensitive to entry and exit times.
*   This helps in avoiding situations where an order gets filled much later when the market conditions have changed and the original reason for the trade is no longer valid.
*   This mechanism is sometimes referred to as "Time in Force" (TIF) for an order, though we are implementing a custom logic for it. Common TIF policies are "Good 'Til Canceled" (GTC), "Immediate or Cancel" (IOC), and "Fill or Kill" (FOK). This feature is about creating a "Good 'Til Time" (GTT) equivalent.
