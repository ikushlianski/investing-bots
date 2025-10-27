# User Story: US-003 - Manage the Strategy Lifecycle

**Feature:** `ft-090-strategy-creation-framework`

## 1. User Story

-   **As a Trader,** I want to define my new strategy, save it as "Balanced BTC Trend v1.0," and have it stored as a versioned entity that I can later assign to a trading bot.
-   **As a Trader,** I want to be able to deploy a new version of my strategy (v1.1) with a slightly tweaked parameter, while the old version (v1.0) continues to run, so I can compare their live performance side-by-side.

## 2. Acceptance Criteria

-   Every strategy created by the Composer must be saved with a unique name and a semantic version number (e.g., `v1.0.0`).
-   All saved strategies must be visible in the `ft-118-strategy-management` library.
-   When a strategy is edited, the user must save it as a new version (e.g., `v1.1.0`), ensuring that the original version remains immutable.
-   The Bot Management UI must allow the user to select a specific strategy *version* from the library to assign to a bot.
-   The system must be able to run bots with different versions of the same core strategy simultaneously.
