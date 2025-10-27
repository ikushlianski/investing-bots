# Feature: ft-112 - Portfolio Analytics

**Status:** Proposed
**Priority:** P1 (High value for overall financial management)
**Depends On:** ft-110-economics-tracking, ft-080-position-management

## 1. Problem Statement

Beyond the performance of individual strategies, a trader needs a high-level, holistic view of their entire investment portfolio. This involves understanding the overall account growth, the history of all transactions, and the current composition of assets.

Without a dedicated portfolio analysis tool, a trader cannot easily answer fundamental questions like, "What is my total net profit across all activities?" or "What was my account balance at the end of last month?"

## 2. Goals

-   To provide a centralized dashboard for analyzing the overall financial health and history of the user's entire portfolio.
-   To present a clear and accurate historical record of all trades and their impact on the portfolio's value.
-   To visualize the portfolio's equity curve over time.
-   To give the user a clear understanding of their current asset allocation.

## 3. Core Components

### a. Portfolio History

-   This component provides a complete, filterable, and searchable log of every trade executed by the system (both by bots and manually). It is the master "account statement" for the entire operation.

### b. Portfolio Equity Curve

-   This component provides a visual representation of the total portfolio value over time, allowing the user to see their account growth at a glance.

### c. Asset Composition

-   This component shows the current breakdown of the portfolio by asset (e.g., 60% BTC, 30% ETH, 10% USDT), providing a clear view of the current allocation.

## 4. User Stories

This feature is defined by the following user story:

-   **US-001: Analyze Portfolio Composition and History**

## 5. Technical Implementation

-   A new **PortfolioAnalytics** service will be created.
-   This service will consume data from the `EconomicsTracker` and the `PositionManager` to build its historical and real-time views.
-   The UI will be updated with a new "Portfolio" dashboard to display these analytics.