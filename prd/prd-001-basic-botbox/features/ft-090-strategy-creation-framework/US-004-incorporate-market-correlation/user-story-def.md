# User Story: US-004 - Incorporate Market Correlation in Strategies

**Feature:** `ft-090-strategy-creation-framework`

## 1. User Story

-   **As a Trader,** when creating a strategy for an altcoin (e.g., SOL/USDT), I want to use Bitcoin's price action as a filter, so that my strategy avoids taking long positions when Bitcoin is in a sharp downturn.
-   **As a Quant,** I want to build a `MarketCorrelationFactor` that analyzes BTC dominance and price velocity, so I can reuse this market context signal across all of my non-BTC strategies.

## 2. Acceptance Criteria

-   A new factor named `MarketCorrelationFactor` (or similar) can be created in the Factor Library.
-   This factor must be able to access historical and real-time price data for an asset that is different from the one being traded (e.g., it must be able to query BTC/USDT data while a SOL/USDT strategy is being evaluated).
-   The factor's output score must reflect the current state of the broader market as defined by Bitcoin's behavior (e.g., trending, dumping, stable).
-   A user must be able to add this `MarketCorrelationFactor` to any strategy in the Weighted Strategy Composer.
-   The backtesting engine must correctly provide the necessary market data to this factor during a simulation.
-   A strategy for an altcoin that includes this factor with a heavy negative weight on "BTC dumping" should show fewer losing trades during historical periods of high BTC volatility.
