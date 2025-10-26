# Feature: ft-100 - Bot Management

**Status:** Proposed
**Priority:** P0 (Core operational feature)
**Depends On:** ft-001-application-framework, ft-118-strategy-management

## 1. Problem Statement

A trader will run multiple strategies on multiple assets, each with its own configuration. This feature provides the central interface for managing the lifecycle of these trading bots. It allows the user to create, configure, deploy, pause, and monitor all of their automated strategies from a single place. It is the primary control panel for the entire trading operation.

## 2. Goals

-   To provide a user interface for creating, viewing, updating, and deleting bot configurations.
-   To manage the lifecycle of a bot (e.g., Draft, Active, Paused, Archived).
-   To link a bot instance to a specific version of a strategy from the Strategy Library.
-   To allow for bot-specific configuration overrides (e.g., different risk parameters for the same strategy on different assets).
-   To enforce the business rule that no two active bots can be identical.

## 3. Core Components

### a. Bot Management Dashboard

-   A UI that displays a list of all bots in the system.
-   **Key information:** Bot Name, Status (Active, Paused, Error), Assigned Strategy, Traded Instrument, and key performance metrics (e.g., 24h P&L).
-   Provides actions for each bot: `Start`, `Pause`, `Edit`, `Archive`.

### b. Bot Configuration Editor

-   A form for creating and editing bot configurations.
-   **Fields:**
    -   **Bot Name:** A unique, human-readable name for the bot.
    -   **Strategy:** A dropdown to select a strategy and version from the `ft-118-strategy-management` library.
    -   **Exchange:** The exchange this bot will trade on.
    -   **Instrument:** The specific trading pair (e.g., `BTC/USDT`) this bot is authorized to trade.
    -   **Risk Parameters:** Bot-specific overrides for risk controls (e.g., max position size, stop-loss percentage). If not provided, the strategy's defaults will be used.
    -   **Mode:** `Live Trading` or `Paper Trading`.

### c. Bot Lifecycle Management

-   Bots will have a clear state machine:
    -   `Draft`: The bot is configured but not yet running.
    -   `Active`: The bot is live and executing its strategy.
    -   `Paused`: The bot is temporarily stopped and will not place new trades. Existing positions are managed according to strategy rules.
    -   `Archived`: The bot is permanently disabled and removed from the main dashboard view.

### d. Uniqueness Enforcement

-   **Business Rule:** The system must prevent the creation of duplicate bots. A bot is considered a duplicate if it has the same **strategy**, **strategy version**, and **instrument** as another active bot.
-   **Implementation:** Before a bot can be created or moved to an `Active` state, the system will perform a check to ensure no other active bot shares this unique combination. This prevents redundant bots that serve no logical purpose and could cause confusion or unintended risk.

## 4. User Stories

-   **As a Trader,** I want to create a new bot, name it "BTC Trend Follower," assign my "Trend" strategy v1.2 to it, configure it to trade "BTC/USDT" on ByBit, and deploy it to paper trading mode.
-   **As an Operator,** I want to see a list of all my bots and their current status (e.g., Active, Paused, Error), so I can quickly assess the health of my entire operation.
-   **As a Trader,** when I try to create a new bot to trade my "RSI" strategy on "ETH/USDT", I want the system to prevent me from saving it if I already have another active bot with that exact same configuration, to avoid pointless duplication.
-   **As a Trader,** I want to pause my "ETH Breakout" bot during a period of high market uncertainty, and then easily resume it later without losing its configuration.

## 5. Technical Implementation

-   A new `Bots` table will be created in the database to store bot configurations, including their state, name, and references to the strategy and instrument.
-   The API Gateway (`ft-008`) will be extended with endpoints for CRUD operations on bots (e.g., `POST /api/bots`, `PUT /api/bots/{id}/status`).
-   The business logic for uniqueness enforcement will be implemented in the backend service that handles the creation and updating of bots.

## 6. Dependencies

-   **ft-001-application-framework:** Provides the foundational UI and backend structure.
-   **ft-118-strategy-management:** The bot configuration process is dependent on the library of available strategies.
-   **ft-010-exchange-connectivity:** Required to specify which exchange a bot will trade on.
-   **ft-030-instrument-whitelisting:** The selected instrument for a bot will be checked against the global whitelist.