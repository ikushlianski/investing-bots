# Feature: ft-090 - Strategy Creation Framework

**Status:** Proposed
**Priority:** P0 (Core to the entire purpose of the application)

## 1. Problem Statement

A trading bot is defined by its strategy. To move beyond rigid, hard-coded logic, the platform needs a flexible and powerful framework for creating, managing, and deploying trading strategies. A professional system requires that strategies be built from reusable components, allowing for rapid, evidence-based iteration.

This feature establishes the end-to-end framework for strategy creation, from the development of individual logic components to their assembly into a final, executable strategy.

## 2. Goals

-   To establish a modular, three-part framework for strategy creation, consisting of the Strategy Lifecycle, a Factor Library, and a Weighted Strategy Composer.
-   To enable the creation of sophisticated strategies by combining reusable, independent logic blocks (factors).
-   To allow for nuanced, evidence-based trade decisions by assigning weights to different factors.
-   To manage strategies as version-controlled, configurable entities.
-   To enable rapid strategy iteration by adjusting compositions and weights, often without writing new code.

## 3. Core Components

The Strategy Creation Framework is composed of three distinct layers:

### a. The Factor Library (The Building Blocks)

-   This is a library of independent, reusable trading logic components called **Factors**.
-   A Factor is a self-contained piece of code that analyzes market data and produces a standardized output (e.g., a score from -1.0 for "strong sell" to +1.0 for "strong buy").
-   **Examples of Technical Factors:** `RsiFactor`, `EmaTrendFactor`, `VolatilityFilterFactor`.
-   **Examples of Contextual Factors:** A `MarketCorrelationFactor` could be created to analyze Bitcoin's price action. This factor would provide a score indicating whether the broader market context is favorable for trading altcoins, allowing strategies to filter trades based on Bitcoin's behavior.

### b. The Weighted Strategy Composer (The Assembly Logic)

-   This is the mechanism for combining Factors from the library into a cohesive strategy.
-   It allows a user to create a **Strategy Definition** by:
    1.  Selecting a set of Factors.
    2.  Assigning a **weight** to each Factor to signify its importance.
    3.  Defining **thresholds** for making a final trade decision based on the combined, weighted score of all factors.
-   This "weight of the evidence" approach is highly flexible and powerful.

### c. The Strategy Lifecycle Management (The Framework)

-   This is the high-level framework for managing the strategies created by the Composer.
-   It treats each Strategy Definition as a version-controlled entity that can be assigned to bots, backtested, and tracked.

## 4. Technical Implementation

-   A new directory will be created for the Factor Library (e.g., `/src/factors`).
-   A **Scoring Engine** will be built to take a Strategy Definition, load the required factors, and perform the weighted calculation to produce a final trade score.
-   The `ft-118-strategy-management` feature will provide the UI and database tables for storing and managing these version-controlled Strategy Definitions.
