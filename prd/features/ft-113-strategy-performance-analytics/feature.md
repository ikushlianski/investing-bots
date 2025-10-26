# Feature: ft-113 - Strategy Performance Analytics

**Status:** Proposed
**Priority:** P1 (High value for strategic decision-making)
**Depends On:** ft-110-economics-tracking, ft-100-bot-management

## 1. Problem Statement

Once a strategy is live, a trader needs to continuously evaluate its performance to determine if it has a real edge. This requires more than just looking at P&L; it involves calculating advanced risk-adjusted metrics to objectively measure a strategy's effectiveness and compare it to others.

This feature provides the analytical tools to treat each strategy as its own "business unit," allowing for a deep, data-driven assessment of its performance.

## 2. Goals

-   To provide a dedicated suite of tools for analyzing the performance of individual trading strategies.
-   To enable the allocation of virtual capital to each strategy to measure its true Return on Investment (ROI).
-   To calculate advanced risk-adjusted performance metrics (e.g., Sharpe Ratio, Sortino Ratio) for each strategy.
-   To provide a clear, comparative view of all active strategies to easily identify winners and losers.

## 3. Core Components

### a. Capital Allocation

-   The system will allow a user to assign a virtual "Allocated Capital" amount to each bot/strategy. This serves as the denominator for calculating performance metrics like ROI.

### b. Per-Strategy Performance Analytics Engine

-   This component consumes the raw data from the `EconomicsTracker` and calculates advanced performance metrics on a per-strategy basis. It answers the question, "How well is this strategy performing with the capital it has been given?"

## 4. User Stories

This feature is defined by the following user story:

-   **US-001: Allocate Capital and Analyze Per-Strategy Performance**

## 5. Technical Implementation

-   A new **StrategyPerformanceAnalytics** service will be created.
-   The `Bots` database table will be updated to include an `allocated_capital` field.
-   The UI will be updated with a new "Strategy Performance" dashboard that displays a "league table" of all strategies, ranked by key performance indicators.
