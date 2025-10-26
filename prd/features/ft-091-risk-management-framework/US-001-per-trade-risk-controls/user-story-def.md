# User Story: US-001 - Implement Per-Trade Risk Controls

**Feature:** `ft-091-risk-management-framework`

## 1. User Story

-   **As a Trader,** I want the system to automatically calculate the correct position size for every trade to ensure I am only risking a fixed 1% of my account capital.
-   **As a Risk Manager,** I want to set a hard rule that no single position can ever exceed 25% of my total account equity, to prevent over-concentration even if a strategy's logic has a bug.

## 2. Acceptance Criteria

-   When defining a strategy or a bot, the user can specify a "Risk per Trade" percentage (e.g., 1%).
-   Before placing an order, the `Order Execution Engine` must calculate the required position size based on the entry price and the stop-loss price. The calculation must follow the formula: `Position Size = (Total Capital * Risk per Trade %) / (Entry Price - Stop-Loss Price)`.
-   The user can define a "Max Position Size" percentage (e.g., 25% of total equity).
-   If the calculated position size for a trade exceeds this maximum, the trade must be rejected.
-   All risk parameters (Risk per Trade %, Max Position Size %) must be configurable on a per-bot basis.
-   If a trade signal is received that does not have a corresponding stop-loss, the trade must be rejected.
