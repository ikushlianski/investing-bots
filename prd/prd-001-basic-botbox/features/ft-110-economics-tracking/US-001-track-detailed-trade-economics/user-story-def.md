# User Story: US-001 - Track Detailed Trade Economics

**Feature:** `ft-110-economics-and-portfolio-analytics`

## 1. User Story

-   **As a Trader,** I want to see a real-time dashboard of my portfolio's net P&L after all fees, funding, and estimated slippage are accounted for, so I know my true performance at any moment.
-   **As a Quant,** I want to analyze a strategy's core performance metrics, such as its Sharpe ratio and profit factor, based on net P&L, to objectively compare it to other strategies and to a buy-and-hold benchmark.

## 2. Acceptance Criteria

-   For every closed trade, the system must record the following:
    -   Gross P&L (based on entry and exit prices).
    -   Fees paid (fetched from the exchange).
    -   Funding costs incurred (for futures positions).
    -   Estimated slippage (the difference between the expected price and the actual fill price).
    -   Net P&L (Gross P&L - all costs).
-   The main dashboard must display the total Net P&L for the entire portfolio.
-   The system must calculate and display standard performance metrics (Sharpe Ratio, Sortino Ratio, Profit Factor, Max Drawdown) based on the Net P&L of a strategy or the whole portfolio.
-   All economic data must be available for export to CSV.
