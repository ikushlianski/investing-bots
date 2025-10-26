# Feature: ft-118 - Strategy Management Interface

**Status:** Proposed
**Priority:** P0 (Critical for user interaction with strategies)
**Depends On:** ft-090-strategy-creation-framework, ft-100-bot-management

## 1. Problem Statement

The `ft-090-strategy-creation-framework` defines a powerful, component-based system for creating trading strategies. However, this framework is purely conceptual without a user interface and a database layer to manage it.

A trader needs a dedicated interface to interact with the framework—to visually compose strategies from factors, to save and version these strategies, and to browse a library of all the strategies they have created. This feature provides the essential user interface and persistence layer that brings the Strategy Creation Framework to life.

## 2. Goals

-   To provide the user interface for the **Weighted Strategy Composer** defined in the `ft-090` framework.
-   To provide a centralized "Strategy Library" where all created strategy definitions are stored, versioned, and displayed.
-   To manage the persistence of strategy definitions in the database.
-   To provide the link between a saved strategy and the bot that will execute it.

## 3. Core Components

### a. Strategy Library UI

-   A new section in the main application UI titled "Strategies".
-   This view will display a list of all available strategies created via the Composer, showing key information like name, version, and the number of bots currently using it. This is the central repository for all strategy definitions.

### b. Strategy Editor UI (The Composer Interface)

-   This is the user interface for the **Weighted Strategy Composer**. It allows a user to visually implement the logic defined in `ft-090`.
-   **Functionality:**
    -   Select factors from the Factor Library.
    -   Assign weights to each factor.
    -   Define entry and exit thresholds.
    -   Set default risk parameters for the strategy.
    -   Name, describe, and save the strategy definition.

### c. Strategy Versioning and Persistence

-   Leverages `ft-145-strategy-versioning-ab-testing`.
-   When a strategy is saved via the Editor, a new immutable, versioned record is created in the database.
-   The UI will allow users to view the version history of a strategy, see what changed between versions, and roll back to a previous version.

### d. Linking Strategies to Bots

-   When creating or editing a bot (in the `ft-100-bot-management` UI), the user will select a strategy from a dropdown list populated from the Strategy Library.
-   The bot's configuration will store a reference to the specific version of the strategy it is using.

## 4. User Stories

-   **As a Trader,** I want to go to a "Strategy Library" to see all the trading strategies I have designed, so I can manage them in one central place.
-   **As a Trader,** I want to use the Strategy Editor to create a new strategy called "ETH Breakout" by combining a `VolatilityFactor` and a `MomentumFactor`, and then save it to my library.
-   **As a Trader,** I want to assign my "ETH Breakout v1.2" strategy to three different bots, each trading on a different timeframe.
-   **As a Trader,** when I update the "ETH Breakout" strategy to version v1.3, I want my existing bots to continue running v1.2 until I explicitly decide to upgrade them.

## 5. Technical Implementation

-   A new database table, `Strategies`, will be created to store the definitions (factor composition, weights, thresholds, etc.) and versioning information.
-   The Bot Management UI will be modified to fetch the list of available strategies and include a `strategy_id` and `strategy_version` in the bot's configuration.

## 6. Dependencies

-   **ft-090-strategy-creation-framework:** This feature provides the direct user interface and database implementation for the concepts defined in the framework.
-   **ft-100-bot-management:** Bots are the consumers of the strategies managed by this feature.
-   **ft-145-strategy-versioning-ab-testing:** Provides the versioning mechanism for strategies.