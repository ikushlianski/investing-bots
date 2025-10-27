# User Story: US-004 - Compare Live vs. Backtested Performance

**Feature:** `ft-120-strategy-validation-suite`

## 1. User Story

-   **As a Trader,** I want to see my bot's live equity curve plotted against its backtested projection, so I can immediately see if it's performing as expected and detect "strategy decay."
-   **As a Trader,** I want to receive an alert if my live strategy's drawdown exceeds its worst-case backtested drawdown by more than 50%, so I can intervene before losses mount.
-   **As a Quant,** I want to track the rolling 100-trade profit factor of my live strategy, so I can detect when its edge is starting to fade.

## 2. Acceptance Criteria

-   When a strategy version is approved for live trading, the key performance metrics from its final backtest (Sharpe ratio, max drawdown, win rate, etc.) must be stored as its "benchmark."
-   A new "Live Analysis" dashboard must be available for each active bot.
-   The dashboard must display a chart that overlays the live equity curve on top of the backtested equity curve for a visual comparison.
-   The dashboard must show a table comparing the benchmark metrics vs. the live performance metrics side-by-side, with significant negative deviations highlighted.
-   The user can configure deviation thresholds (e.g., "alert if live win rate is 20% less than benchmark").
-   A monitoring service must run periodically to check for these deviations and send an alert via the `ft-130-monitoring-alerts` system if a threshold is breached.
