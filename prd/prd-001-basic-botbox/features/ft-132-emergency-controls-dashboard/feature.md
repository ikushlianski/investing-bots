# Feature: ft-132 - Emergency Controls Dashboard

**Status:** Proposed
**Priority:** P0 (Critical for safety and operational control)
**Depends On:** ft-100-bot-management, ft-080-position-management, ft-070-order-execution-engine

## 1. Problem Statement

Automated trading systems run 24/7 and can manage significant capital. While automation removes emotion, it also removes real-time human oversight. In the event of a critical system bug, an unexpected market event (a "black swan"), or a faulty strategy, an operator needs the ability to intervene **immediately and decisively**.

Searching through logs or command-line tools to pause a bot or flatten a position is too slow and error-prone in a crisis. An operator needs a simple, clear, and powerful "big red button" interface to take manual control, prevent further losses, and safely manage the system's state. Hope is not a strategy; a manual override is.

## 2. Goals

-   Provide a single, unambiguous view of the entire trading operation's state.
-   Enable an operator to immediately pause or stop any or all trading bots.
-   Allow for the emergency closure of any or all open positions.
-   Provide the ability to cancel all pending orders to prevent them from being filled.
-   Ensure these emergency actions are logged for later review and require confirmation to prevent accidental use.

## 3. Core Components

This feature is primarily a user interface backed by direct, high-priority commands to the core trading services.

### a. Global "PAUSE ALL TRADING" Button

-   **Functionality:** A single, prominent button on the dashboard.
-   **Action:** When pressed and confirmed, it instructs the `BotManager` to immediately pause all active bots. No new trades will be initiated by any strategy.
-   **Confirmation:** Requires typing "PAUSE" to confirm, to prevent accidental clicks.
-   **State:** The system enters a "MANUAL PAUSE" state, clearly indicated on the UI.

### b. Global "FLATTEN ALL POSITIONS" Button

-   **Functionality:** A second, equally prominent button, often used after pausing.
-   **Action:** When pressed and confirmed, it instructs the `PositionManager` to immediately issue market orders to close all currently open positions across all bots.
-   **Confirmation:** Requires typing "FLATTEN" to confirm.
-   **Use Case:** Used during a market crash or when a strategy has clearly gone haywire and positions need to be exited immediately to preserve capital.

### c. Per-Bot Controls

-   **Functionality:** In the main bot list, each active bot will have its own set of emergency controls.
-   **Actions:**
    -   **Pause Bot:** Halts new trades for that specific bot only.
    -   **Flatten Bot:** Closes all open positions for that specific bot only.

### d. Open Positions and Pending Orders View

-   **Functionality:** A clear, real-time list of all open positions and pending (unfilled) orders across the entire system.
-   **Actions:**
    -   **Close Position:** A manual "close" button next to each individual position.
    -   **Cancel Order:** A "cancel" button next to each pending limit order.

## 4. User Stories

-   **As an Operator,** during a sudden market crash, I want to press one button to immediately close all my long positions, so I can prevent catastrophic losses.
-   **As an Operator,** when I notice a single bot behaving erratically, I want to be able to pause just that bot without affecting my other profitable bots.
-   **As an Operator,** before a major news event (e.g., an FOMC announcement), I want to pause all trading activity to avoid volatility, and then easily resume it afterwards.
-   **As an Operator,** I want a single dashboard where I can see my total P&L, the status of every bot, and every open position, so I have complete situational awareness at a glance.

## 5. Technical Implementation

-   This is primarily a UI feature that will make direct, high-priority API calls to the backend services.
-   The backend services (`BotManager`, `PositionManager`, `OrderExecutionEngine`) must expose endpoints for these emergency actions (e.g., `POST /bots/pause-all`, `POST /positions/close-all`).
-   These endpoints should have the highest priority and bypass any normal queuing to ensure immediate execution.
-   All actions taken through the emergency dashboard must be logged in the audit trail with a special flag (e.g., `source: 'manual_override'`).
-   The UI will use WebSockets to get real-time updates on bot status and position P&L.

## 6. Dependencies

-   **ft-100-bot-management:** The dashboard needs to be able to query and command the state of all bots.
-   **ft-080-position-management:** Required to display and command the closing of open positions.
-   **ft-070-order-execution-engine:** Needed to cancel pending orders and execute market orders for flattening positions.
-   **ft-020-audit-logging:** All emergency actions must be meticulously logged.
