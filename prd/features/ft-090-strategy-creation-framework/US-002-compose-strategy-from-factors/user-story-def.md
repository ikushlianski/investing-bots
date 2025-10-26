# User Story: US-002 - Compose a Strategy from Factors

**Feature:** `ft-090-strategy-creation-framework`

## 1. User Story

-   **As a Strategy Developer,** I want to create a new "Trend Confirmation" strategy by selecting the `EmaTrendFactor` and the `MacdFactor` from the library, assigning a 60% weight to the trend and 40% to MACD.
-   **As a Quant,** after backtesting, I want to easily change the weight of the `VolatilityFilterFactor` in my strategy from 0.2 to 0.3, to see if giving it more influence improves the risk-adjusted return, without having to rewrite any code.

## 2. Acceptance Criteria

-   The Strategy Editor UI must provide a list of all available factors from the Factor Library.
-   A user can select one or more factors to include in a new strategy definition.
-   For each selected factor, the user can input a numerical weight.
-   The user can define the `long_entry`, `short_entry`, and `exit` score thresholds for the strategy.
-   Saving the configuration creates a new, versioned Strategy Definition file (e.g., in YAML or JSON format).
-   The backend Scoring Engine can correctly parse this definition, calculate the weighted score at each candle, and make the correct trade decision based on the thresholds.
