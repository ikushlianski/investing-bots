# BotBox Toddler MVP Tasks (User-Centric Plan)

This plan is structured around the user-facing features required to create, manage, and monitor a portfolio of trading bots on the Bybit testnet.

## Epic 1: Bot Management & Configuration

**Goal:** Allow the user to create, view, and manage a portfolio of customized trading bots.

- [ ] **Database Schema for Bots:**
    - Create a `bots` table to store bot configurations: `name`, `strategy_params` (e.g., timeframe, indicators used), `risk_profile` (e.g., 'cautious', 'aggressive'), `virtual_capital`, and `status` (e.g., 'active', 'paused').

- [ ] **Bot Management API:**
    - Create CRUD API endpoints (`/api/bots`) for creating, reading, updating, and deleting bot configurations.
    - Implement endpoints to start and stop bot trading activity.

- [ ] **Bot Dashboard UI:**
    - Build a UI view that lists all created bots, showing their name, status, and key configuration parameters.
    - Add buttons to navigate to a bot's detail page, and to start/stop its trading activity.

- [ ] **Bot Creation/Editor UI:**
    - Create a form that allows users to define a new bot by:
        - Giving it a name.
        - Assigning a virtual capital amount.
        - Selecting a timeframe (1h, 4h, 1d).
        - Choosing a risk profile (this will influence position sizing).
        - Selecting a simple strategy (e.g., number of confirmation signals required).

## Epic 2: Core Trading Engine & Multi-Bot Orchestration

**Goal:** Run the trading logic for all "active" bots on a schedule, respecting each bot's unique configuration.

- [ ] **Bybit Testnet Integration:**
    - Securely configure API credentials for the Bybit futures testnet.
    - Implement core exchange functions: fetch candles, get current price, place/cancel futures orders (long and short), and get account balance.

- [ ] **Scheduled Trading Loop:**
    - Set up a Cloudflare Cron trigger to run the main orchestration function every 15 minutes.

- [ ] **Multi-Bot Trading Loop:**
    - Modify the main `runTradingLoop` to first fetch all `active` bots from the database.
    - The loop will then iterate through each bot, running the 8-phase trading logic tailored to that bot's specific strategy, timeframe, and risk parameters.

- [ ] **Configurable Trading Logic:**
    - Adapt the underlying trading functions (setup scanning, trade execution) to accept bot-specific parameters (e.g., use `bot.risk_profile` to calculate position size).

## Epic 3: Decision Logging & Live Feed

**Goal:** Provide users with a clear, real-time log of every decision each bot makes.

- [ ] **Database Schema for Decisions:**
    - Create a `bot_decisions` table with fields like `bot_id`, `timestamp`, `decision_type` (e.g., 'SETUP_FOUND', 'TRADE_ENTERED', 'STOP_MOVED'), and a `details` JSON blob for context.

- [ ] **Integrate Logging into Engine:**
    - Throughout the 8-phase trading loop, insert records into the `bot_decisions` table whenever a significant event occurs for any bot.

- [ ] **Decision Feed API:**
    - Create an API endpoint (`/api/bots/:id/decisions`) to fetch the decision history for a specific bot.

- [ ] **Decision Feed UI:**
    - On the bot detail page, display a simple, auto-refreshing list or table showing the stream of decisions made by that bot.

## Epic 4: Analytics & Trade Visualization

**Goal:** Visualize historical market data and bot performance to allow for analysis.

- [ ] **Time-Series Data Storage:**
    - **[Research]** Confirm the best approach for storing candle data on Cloudflare (D1 is the likely MVP choice).
    - Create a `candles` table to store OHLCV data for relevant instruments and timeframes.
    - Implement a separate, scheduled worker to periodically fetch and save historical candle data from Bybit.

- [ ] **TradingView Chart Integration:**
    - Embed a TradingView chart into the bot detail page.
    - Create an API endpoint to serve historical candle data and trade history (entry/exit points) for the selected bot.
    - Write the client-side code to load this data into the chart and display markers for where trades were opened and closed.

- [ ] **Basic Performance Analytics:**
    - Develop database queries to calculate simple performance metrics for each bot (e.g., total P&L, win/loss ratio).
    - Create an API endpoint to serve these analytics.
    - Display these key stats in a simple dashboard on the bot detail page.