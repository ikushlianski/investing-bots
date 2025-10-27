# User Story: US-002 - Backtest Strategies on Historical Data

**Feature:** `ft-120-strategy-validation-suite`

## 1. User Story

-   **As a Quant,** I want to test my new strategy across 5 years of historical BTC/USDT data, so I can understand its long-term performance, including its maximum drawdown and Sharpe ratio.
-   **As a Trader,** I want to quickly compare the backtest results of two different versions of my strategy, so I can make a data-driven decision about which one to deploy.

## 2. Acceptance Criteria

-   From the UI, a user can select a strategy and a specific version to backtest.
-   The user can configure the backtest parameters:
    -   Instrument (e.g., BTC/USDT).
    -   Timeframe (e.g., 1H).
    -   Date range.
-   The backtesting engine will simulate the strategy's execution over the specified historical data, accounting for estimated fees and slippage.
    -   The system should allow configuring a baseline slippage (e.g., 0.1%) and a stress-test slippage (e.g., 0.3%).
    -   The backtest report must clearly indicate the slippage assumption used.
    -   A warning should be issued if a strategy's profit per trade is less than or equal to the assumed slippage, indicating a lack of edge.
-   Upon completion, the system must display a detailed performance report, including:
    -   Total P&L and Return %.
    -   Sharpe Ratio and Profit Factor.
    -   Max Drawdown.
    -   Win Rate and Average Win/Loss.
    -   An equity curve chart.
    -   A list of all simulated trades.
-   Backtest results must be saved and associated with the strategy version for later comparison.
