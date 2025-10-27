# Feature: ft-131 - Main Dashboard UI

**Status:** Proposed
**Priority:** P0 (Core User Interface)
**Tier:** 4
**Depends On:** ft-100-bot-management, ft-110-economics-tracking, ft-080-position-management, ft-132-emergency-controls-dashboard

## 1. Problem Statement

The user needs a single, centralized place to get a high-level overview of their entire trading operation. While other features define specific controls (`ft-132`) or detailed reports (`ft-110`), this feature defines the main "home page" or "mission control" dashboard. It's the first thing the user will see after logging in and should provide immediate answers to the most important questions: "Am I making money?" and "Is everything running correctly?"

## 2. Goals

-   To provide an at-a-glance summary of the portfolio's financial performance.
-   To display the status of all active and paused trading bots.
-   To show a summary of all currently open positions.
-   To provide easy access to the most critical operational controls.
-   To serve as the central hub from which users can navigate to more detailed views.

## 3. Key Dashboard Components

The main dashboard will be a composite UI that synthesizes data from multiple backend services. It will be composed of several key widgets:

### a. Portfolio Performance Summary

-   **Data Source:** `ft-110-economics-tracking`
-   **Content:**
    -   A large, prominent display of the **Total P&L** (realized + unrealized).
    -   Key performance indicators (KPIs) such as **Total Return %**, **24-Hour P&L**, and **Sharpe Ratio**.
    -   A historical equity curve chart showing the portfolio's value over time.

### b. Bot Status Overview

-   **Data Source:** `ft-100-bot-management`
-   **Content:**
    -   A summary count (e.g., "3 Active, 1 Paused, 2 In Test").
    -   A list or card view of all active/paused bots, showing their individual status, recent P&L, and last activity timestamp.
    -   Each bot entry will link to its detailed configuration and performance page.

### c. Open Positions Summary

-   **Data Source:** `ft-080-position-management`
-   **Content:**
    -   A summary of all currently open positions across all bots.
    -   Key details for each position: Asset, Direction (Long/Short), Size, Entry Price, Current Price, and Unrealized P&L.

### d. Quick Access to Emergency Controls

-   **Functionality Source:** `ft-132-emergency-controls-dashboard`
-   **Content:**
    -   A clearly visible, but safely designed, section that provides access to the global "PAUSE ALL TRADING" and "FLATTEN ALL POSITIONS" controls. This ensures the operator can react instantly from the main view.

## 4. User Stories

-   **As a Trader,** when I log in, I want to immediately see my total profit or loss, so I know how my portfolio is performing at a glance.
-   **As an Operator,** I want the main dashboard to show me if any of my bots are in an error state, so I can investigate immediately.
-   **As a Trader,** I want to see a list of all my open positions on the home page, so I can quickly assess my current market exposure.
-   **As an Operator,** in a market panic, I want the "PAUSE ALL" button to be accessible directly from the main dashboard, so I don't waste precious seconds navigating through menus.

## 5. Dependencies

-   **ft-100-bot-management:** To provide the list and status of all bots.
-   **ft-110-economics-tracking:** To provide the portfolio P&L and performance metrics.
-   **ft-080-position-management:** To provide the list of open positions.
-   **ft-132-emergency-controls-dashboard:** To provide the functionality for the quick access controls.
-   **ft-008-api-gateway:** The dashboard UI will fetch all its data through the secure API gateway.
