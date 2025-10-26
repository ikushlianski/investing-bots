# User Story: US-001 - Analyze Portfolio Composition and History

**Feature:** `ft-112-portfolio-analytics`

## 1. User Story

-   **As a Trader,** I want to view a historical log of every trade I've ever taken, with the ability to filter by date and asset, so I can review my past activity and prepare for tax reporting.
-   **As an Investor,** I want to see a chart of my total account equity over the last year, so I can understand my overall portfolio growth.
-   **As a Portfolio Manager,** I want to see a real-time breakdown of my current asset allocation, so I know how my capital is currently deployed.

## 2. Acceptance Criteria

-   A new "Portfolio" dashboard must be created.
-   This dashboard must contain a **Trade History** table that lists every closed trade from the `EconomicsTracker`, showing the asset, date, P&L, and other key details. This table must be searchable and filterable.
-   The dashboard must feature an **Equity Curve** chart that plots the total portfolio value over time. The user must be able to select the time range (e.g., last 30 days, last year, all time).
-   The dashboard must include an **Asset Allocation** pie chart or table showing the current percentage of the portfolio held in each asset (e.g., BTC, ETH, USDT).
