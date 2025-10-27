# User Story: US-002 - Implement Portfolio-Level Risk Controls

**Feature:** `ft-091-risk-management-framework`

## 1. User Story

-   **As a Trader,** I want to define a maximum daily loss limit for my entire portfolio, so that I can walk away from the screen knowing I can't lose more than 5% in a single day.
-   **As a Trader,** I want to prevent all my bots from buying Bitcoin at the same time, so that I am not over-exposed to a single asset's sudden crash.
-   **As a System Operator,** I want a master "kill switch" that halts all trading if the portfolio's peak-to-trough drawdown exceeds 20%, to prevent a runaway algorithm from blowing up the account.

## 2. Acceptance Criteria

-   The system must track the total portfolio equity in real-time.
-   The user can configure the following **Portfolio Drawdown Circuit Breakers**:
    -   **Daily Max Loss %:** If portfolio equity drops by this percentage from the start of the UTC day, all new trades are blocked for the remainder of the day.
    -   **Weekly Max Loss %:** If portfolio equity drops by this percentage from the start of the week, all new trades are blocked for the remainder of the week.
    -   **Max Drawdown %:** If portfolio equity drops by this percentage from its all-time high, all bots are paused indefinitely and require manual intervention.
-   The user can define **Asset Concentration Limits** (e.g., "max 25% of portfolio in BTC").
-   Before any trade is placed, the `RiskManager` must check if the new position would breach any of these portfolio-level limits.
-   If a limit would be breached, the trade is rejected, and a high-priority alert is logged.
-   A real-time dashboard must display the current portfolio status relative to these limits (e.g., "Daily Loss: -2.3% / -5.0% limit").
