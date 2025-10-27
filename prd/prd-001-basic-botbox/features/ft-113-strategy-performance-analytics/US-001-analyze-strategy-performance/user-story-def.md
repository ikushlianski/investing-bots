# User Story: US-002 - Allocate Capital and Track Per-Strategy Performance

**Feature:** `ft-110-economics-and-portfolio-analytics`

## 1. User Story

-   **As a Portfolio Manager,** I want to allocate a virtual budget of $25,000 to my new "ETH Momentum" bot, so I can track its performance and Return on Investment (ROI) independently of my other strategies.
-   **As a Trader,** I want to view a dashboard that shows me a "league table" of all my bots, ranked by their risk-adjusted return, so I can make an objective decision to cut the ones that are underperforming and allocate more capital to the winners.

## 2. Acceptance Criteria

-   In the `ft-100-bot-management` UI, the user must be able to assign a specific "Allocated Capital" amount to each bot.
-   The system must prevent the total allocated capital from exceeding the total portfolio equity.
-   A new "Strategy Performance" dashboard must be created.
-   This dashboard must display a table of all bots/strategies, showing:
    -   Allocated Capital.
    -   Net P&L.
    -   Return on Allocated Capital (%).
    -   Sharpe Ratio.
    -   Max Drawdown.
-   The user must be able to sort this table by any of the performance metrics.
-   The system must calculate and display a break-even point for each strategy, showing how much it needs to make to recover its historical losses.
