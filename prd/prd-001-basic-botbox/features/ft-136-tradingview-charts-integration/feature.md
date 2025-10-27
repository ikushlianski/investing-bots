# Feature: ft-136 - TradingView Chart Integration

**Status:** Proposed
**Priority:** P1 (High value for visualization)
**Depends On:** ft-131-main-dashboard-ui, ft-080-position-management, ft-115-historical-data-management

## 1. Problem Statement

While performance metrics and P&L curves provide a quantitative view of a strategy's performance, they do not offer a qualitative, visual context of *why* trades were made. A trader needs to see their bot's entry and exit points overlaid on a price chart to intuitively understand the strategy's behavior in relation to market action.

This visual feedback is crucial for debugging, building confidence in a strategy, and identifying potential areas for improvement (e.g., noticing that exits are consistently premature or entries are lagging).

## 2. Goals

-   To provide an integrated charting solution for visualizing bot performance directly within the application.
-   To display historical trades (entry and exit points) for any given bot on a price chart.
-   To allow for the overlay of key indicators or levels (e.g., support/resistance, moving averages) that were part of the strategy's logic.
-   To use a professional, high-performance, and free charting library to accomplish this.

## 3. Chosen Technology (Decision)

-   **Library:** **TradingView Lightweight Charts™**
-   **Rationale:**
    -   **Free:** It is a free, standalone library, which aligns with the project's goal of avoiding expensive dependencies.
    -   **High-Performance:** It is designed to handle large datasets and provides a smooth user experience.
    -   **Customizable:** It offers a rich API for adding custom markers, series, and drawings, which is perfect for plotting buy/sell signals and other strategic elements.
    -   **Industry Standard:** TradingView charts are the industry standard, providing a familiar and professional interface for the user.

## 4. Core Components

### a. Charting Component

-   A reusable UI component will be created that wraps the TradingView Lightweight Charts library.
-   This component will be responsible for initializing the chart, loading historical price data, and rendering any custom markers or series.

### b. Data Integration

-   The charting component will fetch historical OHLCV data from the `ft-115-historical-data-management` service.
-   It will also fetch the trade history for a selected bot from the `ft-080-position-management` service (specifically, the historical/closed positions).

### c. Trade Visualization

-   **Entry/Exit Markers:**
    -   When a bot's trade history is loaded, the chart will display clear markers on the price series.
    -   A green "up" arrow will indicate a long entry or short cover.
    -   A red "down" arrow will indicate a short entry or long exit.
    -   Lines will connect the entry and exit markers for a single trade to visualize its duration and P&L.
-   **Indicator Plotting (Phase 2):**
    -   The component will be designed to allow for the plotting of additional data series, such as moving averages or RSI values, that were used by the strategy.

## 5. User Stories

-   **As a Trader,** after a bot has completed several trades, I want to view its trade history on a TradingView chart, so I can visually verify that its entries and exits align with my strategy's rules.
-   **As a Quant,** while analyzing a strategy's performance, I want to see all its historical buy and sell points on a chart, so I can identify patterns in its behavior (e.g., "it always sells too early in a strong trend").
-   **As a Developer,** I want a simple way to integrate a powerful charting library, so I can provide a rich data visualization experience without having to build a charting solution from scratch.

## 6. Technical Implementation

-   The TradingView Lightweight Charts library will be added as a frontend dependency to the project.
-   A new API endpoint will be required to fetch the trade history for a specific bot in a format suitable for the charting component.
-   The chart component will be integrated into a new "Analysis" or "Chart" tab on the individual bot's detail page.

## 7. Dependencies

-   **ft-131-main-dashboard-ui:** The charting component will be a key part of the analytics and visualization section of the UI.
-   **ft-080-position-management:** Provides the historical trade data (entry/exit prices and times) to be plotted.
-   **ft-115-historical-data-management:** Provides the underlying OHLCV price data for the chart.
