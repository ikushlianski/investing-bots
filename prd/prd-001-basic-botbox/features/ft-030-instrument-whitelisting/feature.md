# Feature: ft-030 - Instrument Whitelisting & Management

**Status:** Proposed
**Priority:** P0 (Critical for security and data integrity)
**Depends On:** ft-010-exchanges

## 1. Problem Statement

A trading bot should only be allowed to trade assets that are appropriate for its strategy and have been explicitly approved by the operator. Without a strict whitelisting mechanism, a misconfigured signal or a bug could cause a bot to trade a highly volatile, illiquid, or unintended asset, leading to significant financial loss.

Furthermore, the system needs a definitive, internal list of tradable instruments. Relying on dynamic API calls to exchanges for this information is inefficient and can lead to inconsistencies. The system requires a managed, local cache of available instruments.

## 2. Goals

-   To establish a master list of all instruments approved for trading within the platform.
-   To provide a mechanism for fetching and storing a list of all available trading pairs from connected exchanges.
-   To ensure that each bot is explicitly granted permission to trade only specific, whitelisted instruments.
-   To prevent any trade from being executed on an instrument that is not on the bot's specific whitelist.

## 3. Core Components

### a. Instrument Data Management

-   **Instrument Database:** A dedicated table in the database will store a unique list of all tradable instruments available across all connected exchanges.
    -   **Schema:** `instrument_id`, `symbol` (e.g., 'BTC/USDT'), `base_asset` ('BTC'), `quote_asset` ('USDT'), `source_exchange` ('Binance').
-   **Instrument Fetcher Service:**
    -   A service responsible for connecting to exchange APIs (starting with Binance, then ByBit) to fetch their complete list of tradable pairs.
    -   This service will run periodically (e.g., weekly) or on-demand to update the local instrument database.
    -   It will handle the de-duplication of instruments that exist on multiple exchanges. The system will initially support up to 300 unique instruments.

### b. Bot Whitelist Configuration

-   **Explicit Grant:** When configuring a bot via the `ft-100-bot-management` interface, the user **must** select the specific instrument(s) that the bot is permitted to trade from the master instrument list.
-   **No Wildcards:** A bot cannot be configured to trade "all" or a dynamic set of instruments. The permission must be explicit for each trading pair.

### c. Pre-Trade Verification

-   The `ft-070-order-execution-engine` will be modified to include a mandatory pre-trade check.
-   Before any order is placed, the engine must verify that the instrument for the trade is present in the specific whitelist for the bot that initiated the trade.
-   If the instrument is not on the bot's whitelist, the order will be rejected, and a critical alert will be logged.

## 4. User Stories

-   **As an Operator,** I want the system to automatically fetch and maintain a list of all available trading pairs from Binance and ByBit, so I have a master list to choose from.
-   **As a Trader,** when I set up a new bot, I want to be forced to choose the *exact* instrument it can trade, like "BTC/USDT", so I can be 100% certain it will never accidentally trade anything else.
-   **As a Risk Manager,** I want the system to block any trade signal for an instrument that is not explicitly whitelisted for that specific bot, providing a critical layer of security against configuration errors.

## 5. Technical Implementation

-   A new database table, `Instruments`, will be created.
-   A new service will be developed that uses the `ft-010-exchanges` module to call the `getSymbols` or equivalent endpoint on the exchange APIs.
-   The `Bots` configuration table will include a field to store the list of whitelisted instrument IDs for each bot.
-   The `OrderExecutionEngine` will be updated to include the validation logic before an order is submitted.

## 6. Dependencies

-   **ft-010-exchanges:** Provides the API access needed to fetch the list of instruments from exchanges.
-   **ft-100-bot-management:** The UI for configuring a bot's specific instrument whitelist.
-   **ft-070-order-execution-engine:** The enforcement point for the whitelist check.