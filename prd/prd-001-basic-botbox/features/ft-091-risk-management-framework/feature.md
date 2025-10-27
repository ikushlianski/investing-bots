# Feature: ft-091 - Risk Management Framework

**Status:** Proposed
**Priority:** P0 (Critical for capital preservation)
**Depends On:** ft-070-order-execution-engine, ft-080-position-management

## 1. Problem Statement

A profitable strategy can still lead to catastrophic losses without a robust, multi-layered risk management framework. Risk must be managed at two distinct levels: the individual trade and the overall portfolio.

-   **Per-Trade Risk:** Without automated position sizing and stop-losses, a single trade can cause an unacceptably large loss.
-   **Portfolio Risk:** A portfolio of individually "safe" trades can become extremely risky if all trades are correlated (e.g., 10 bots buying BTC at the same time). This concentration risk can lead to rapid, severe drawdowns that exceed the trader's tolerance.

This feature establishes a comprehensive, two-tiered risk management framework to ensure disciplined capital preservation at all times.

## 2. Goals

-   To implement a framework for defining and enforcing risk rules at both the per-trade and portfolio levels.
-   To ensure no single trade can cause a catastrophic loss.
-   To prevent catastrophic losses from correlated positions and over-concentration in a single asset.
-   To automatically halt trading when portfolio-level loss limits are breached.

## 3. Core Components

### a. Per-Trade Risk Controls

This layer of the framework focuses on the risk of individual positions. It includes rules that are applied by the `Order Execution Engine` before any trade is placed.
-   **Position Sizing:** Automatically calculates the size of a position based on a predefined risk percentage of the total capital.
-   **Stop-Loss Enforcement:** Ensures that every trade has a defined stop-loss.

### b. Portfolio-Level Risk Controls

This layer acts as a master governor, monitoring the aggregate risk of all open positions.
-   **Drawdown Circuit Breakers:** Automatically halts all new trading if the total account equity drops by a predefined percentage (daily, weekly, or max).
-   **Asset Concentration Limits:** Prevents the system from becoming over-exposed to a single asset (e.g., limiting the total value of all BTC positions to 25% of the portfolio).

## 4. User Stories

This feature is broken down into the following user stories:
-   **US-001: Implement Per-Trade Risk Controls**
-   **US-002: Implement Portfolio-Level Risk Controls**

## 5. Technical Implementation

-   A new **RiskManager** service will be created to centralize risk calculations.
-   The `OrderExecutionEngine` will be modified to consult the `RiskManager` before placing any trade. The request will be rejected if it violates either per-trade or portfolio-level rules.
-   The `RiskManager` will subscribe to the `PositionManager` to get real-time updates on all open positions and to the `EconomicsTracker` for P&L data needed to calculate drawdowns.
