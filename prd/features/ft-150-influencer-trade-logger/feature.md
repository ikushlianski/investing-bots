# Feature: ft-150 - Influencer Trade Logger

**Status:** Proposed
**Priority:** P2 (Nice to have, not core)
**Depends On:** ft-080-position-management

## 1. Problem Statement

Traders often get trade ideas from external sources like social media influencers, newsletters, or private groups. While these trades are discretionary and not part of the automated system, it's valuable to track their performance systematically. Manually logging these trades in a spreadsheet is tedious, error-prone, and disconnected from the main trading platform.

This feature provides a simple way to log these "influencer-recommended" trades within the platform, allowing the trader to analyze their performance over time and determine which sources, if any, provide real value.

## 2. Goals

-   Provide a simple UI to manually log trades based on external recommendations.
-   Capture key metadata for each trade: the source of the idea (e.g., influencer name), a link to the source material (e.g., tweet or video URL), and the trader's rationale.
-   Track the performance of these trades separately from the automated bots.
-   Analyze performance by source to identify which influencers are profitable to follow.

## 3. Core Components

### a. Manual Trade Entry Form

A simple form with the following fields:
-   **Asset:** e.g., `BTC/USDT`
-   **Direction:** Long / Short
-   **Entry Price:** The price at which the trade was entered.
-   **Position Size:** The amount of capital allocated.
-   **Source:** Name of the influencer or source (e.g., "CryptoCred", "The Wolf of All Streets").
-   **Source URL:** A direct link to the tweet, video, or article.
-   **Rationale:** A brief note on why the trade was taken.

### b. Trade Management

-   Once entered, these trades will be tracked by the `PositionManager` but flagged as `discretionary` or `manual`.
-   The user will be responsible for manually marking the trade as closed by entering the exit price.

### c. Performance Analytics Dashboard

-   A new dashboard, separate from the bot analytics, will show the performance of these manual trades.
-   **Key Metrics:** Total P&L, Win Rate, Average Return.
-   **Performance by Source:** A breakdown of profitability by influencer.

    | Influencer | Trades | Win Rate | Net P&L |
    | :--- | :--- | :--- | :--- |
    | CryptoCred | 15 | 60% | +$2,500 |
    | Ben Armstrong | 10 | 30% | -$4,000 |
    | The Wolf... | 22 | 55% | +$1,200 |

## 4. User Stories

-   **As a Trader,** after watching a YouTube video recommending a trade, I want to quickly log that trade in my system, including a link to the video, so I can track its performance.
-   **As a Trader,** I want to see a report at the end of the month showing which of the influencers I follow has made me the most money, so I know whose advice is worth paying attention to.
-   **As a Trader,** I want to keep my discretionary "fun" trades separate from my systematic bot trades, so I can clearly distinguish between the two performance records.

## 5. Technical Implementation

-   This is primarily a UI feature that will create special manual positions in the `PositionManager`.
-   A new table will be needed in the database to store the extra metadata (source, URL, rationale).
-   The `EconomicsTracker` will need to be able to filter for these `discretionary` trades to create the separate performance reports.

## 6. Dependencies

-   **ft-080-position-management:** To store and track the open/closed state of the manual trades.
-   **ft-110-economics-tracking:** To calculate the P&L for the manual trades.
