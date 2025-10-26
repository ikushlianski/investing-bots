# Feature: ft-065 - Test Strategy Implementation (Bollinger Band Mean Reversion)

**Status:** Proposed
**Priority:** P1 (Crucial for validating the strategy framework)
**Depends On:** ft-090-strategy-development, ft-092-factor-library, ft-095-weighted-strategy-composer

## 1. Problem Statement

The strategy development framework (`ft-090`, `ft-092`, `ft-095`) provides a theoretical and abstract model for creating strategies by composing factors. However, without a concrete implementation of a real-world trading strategy, the framework remains untested and unvalidated.

To prove that the factor library and strategy composer are functional and flexible enough, a well-defined test strategy must be implemented. This will serve as the first "real" strategy in the system and act as a baseline and example for all future strategy development.

## 2. Goals

-   To implement the "Bollinger Band Mean Reversion" strategy (`ST-002`) as a collection of reusable factors within the Factor Library.
-   To create a default strategy definition using the Strategy Composer that combines these factors according to the logic in `ST-002`.
-   To validate that the entire strategy development and execution pipeline works end-to-end, from factor calculation to trade decision.
-   To provide a clear, working example for how new strategies can be developed and integrated into the system.

## 3. Core Components

### a. New Factors for the Factor Library (`ft-092`)

The following new, reusable factors will be created based on the `ST-002` document:

-   **`BollingerBandFactor`:**
    -   **Logic:** Calculates the upper, middle, and lower Bollinger Bands.
    -   **Output:** Returns a score indicating how close the current price is to the upper or lower band. A score of `+1.0` means the price is at or above the upper band (overbought), and `-1.0` means it's at or below the lower band (oversold).
-   **`RsiFactor`:**
    -   **Logic:** Calculates the RSI(14).
    -   **Output:** Returns a score based on the RSI value, normalized between -1.0 and +1.0, where values above 70 approach +1.0 and values below 30 approach -1.0.
-   **`AdxMarketRegimeFactor`:**
    -   **Logic:** Calculates the ADX(14) on a higher timeframe (4H).
    -   **Output:** Acts as a filter. It returns a neutral score (`0.0`) if ADX is below 20 (ranging market), but a strong negative score if ADX is above 25 (trending market), effectively vetoing trades.

### b. Default Strategy Composition (`ft-095`)

A new default strategy definition file will be created: `st-002-bollinger-band-mean-reversion-v1.yml`.

-   **Composition:** It will combine the new factors.
    -   `BollingerBandFactor`: `weight: 0.5`
    -   `RsiFactor`: `weight: 0.3`
    -   `AdxMarketRegimeFactor`: `weight: 0.2`
-   **Thresholds:**
    -   `long_entry`: `-0.8` (A strong "oversold" signal is required).
    -   `short_entry`: `0.8` (A strong "overbought" signal is required).
    -   `exit`: `0.1` (Exit when the score moves back towards neutral).

## 4. User Stories

-   **As a Developer,** I want to implement the Bollinger Band strategy by creating three distinct factors, so I can prove that the factor-based architecture is modular and effective.
-   **As a Quant,** I want to see the "Bollinger Band Mean Reversion" strategy available in the Strategy Library, so I can immediately assign it to a bot for backtesting or paper trading.
-   **As a Trader,** I want to use this first, simple strategy as a template, so I can easily create a new version with slightly different weights or thresholds to test my own variations.

## 5. Validation

-   The implemented strategy will be run through the backtester (`ft-120`) on historical data for BTC/USDT.
-   The trade logs will be visually inspected using the `ft-136-tradingview-charts-integration` to ensure that the entry and exit points align with the logic described in the `ST-002` document.

## 6. Dependencies

-   **ft-090-strategy-development:** This feature provides the context and purpose for implementing a strategy.
-   **ft-092-factor-library:** The new factors (BBands, RSI, ADX) will be added to this library.
-   **ft-095-weighted-strategy-composer:** The strategy will be defined using the composition model from this feature.
-   **ft-120-backtesting:** Required to validate that the implemented strategy performs as expected.
-   **ft-136-tradingview-charts-integration:** Required for visual validation of the strategy's behavior.
