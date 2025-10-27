# Feature: ft-110 - Economics Tracking

**Status:** Proposed
**Priority:** P0 (Critical for measuring profitability)
**Depends On:** ft-080-position-management

## 1. Problem Statement

To determine if a trading operation is truly profitable, every cost associated with trading must be meticulously tracked. Relying on gross profit and loss is misleading, as it ignores the impact of fees, funding rates, and slippage, which can significantly erode returns.

This feature establishes the foundational accounting engine for the platform. It is responsible for the low-level "bookkeeping" of every transaction, ensuring that a complete and accurate financial record is maintained for every trade.

## 2. Goals

-   To create a definitive, data-driven accounting engine for all trading activity.
-   To track not only gross P&L but also all associated costs, including exchange fees, funding payments, and estimated slippage.
-   To calculate the true net profitability of every single trade.
-   To provide the foundational, verified financial data that all higher-level performance analytics will be built upon.

## 3. Core Components

### Economics Tracking Engine

-   This is the core accounting layer of the system.
-   It subscribes to "position closed" events from the `Position Manager`.
-   For each event, it is responsible for fetching or calculating all associated financial data and storing it in a dedicated `Trades` table.

## 4. User Stories

This feature is defined by the following user story:

-   **US-001: Track Detailed Trade Economics**

## 5. Technical Implementation

-   A new **EconomicsTracker** service will be created.
-   New database tables will be required to store the detailed economic data for each trade (e.g., `trade_id`, `gross_pnl`, `fees`, `funding_costs`, `net_pnl`).
-   This service will provide the raw, verified financial data for other services, like the `PortfolioAnalytics` feature, to consume.