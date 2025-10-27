# Feature: ft-160 - Performance Analytics with AI

**Status:** Proposed
**Priority:** P3 (Future enhancement)
**Depends On:** ft-110-economics-tracking, ft-020-audit-logging, ft-115-historical-data-management

## 1. Problem Statement

Standard performance metrics (Sharpe ratio, win rate, etc.) provide a good overview of a strategy's performance. However, they don't always reveal the deeper, more subtle patterns hidden in the trade data. Answering questions like "Under what specific market conditions does my strategy perform best?" or "What is the common characteristic of my biggest losing trades?" often requires hours of manual data analysis.

This feature leverages Large Language Models (LLMs) to perform an AI-powered analysis of a bot's trade history, uncovering insights that are not immediately obvious from standard dashboards.

## 2. Goals

-   To use AI to analyze a bot's complete trade log and provide actionable, human-language insights.
-   To identify the specific market regimes (e.g., "high volatility, low volume") where a strategy excels or fails.
-   To find hidden correlations in the data (e.g., "This bot's performance degrades significantly on weekends").
-   To automate the process of post-trade analysis and generate sophisticated performance reviews.

## 3. Core Components

### a. Data Aggregation and Prompt Engineering

-   A service will be created to aggregate all relevant data for a given bot over a specific period. This includes:
    -   The full trade log from `EconomicsTracker`.
    -   The audit log of all decisions from `AuditLogger`.
    -   The historical market data (OHLCV) from `HistoricalDataManager` for the trading period.
-   This aggregated data will be formatted into a sophisticated prompt for an LLM like Claude or Gemini.
-   **Prompt Engineering** will be key. The prompt will be carefully designed to ask the LLM to act as an expert trading performance analyst and to look for specific types of patterns.

### b. AI Analysis Service

-   This service will take the generated prompt and send it to the chosen LLM API.
-   It will receive the text-based analysis back from the model.

### c. AI Insights Dashboard

-   A new section in the UI will display the AI-generated report.
-   The report will be presented in a clear, readable format with sections like:
    -   **Executive Summary:** A high-level overview of the findings.
    -   **Winning Conditions:** A description of the market conditions under which the bot performed best.
    -   **Losing Conditions:** A description of the conditions under which the bot performed worst.
    -   **Actionable Recommendations:** Suggestions for potential improvements (e.g., "Consider adding a volatility filter to avoid trading during choppy, low-volume periods.").
    -   **Hidden Patterns:** Any other interesting correlations the model discovered.

## 4. User Stories

-   **As a Trader,** I want to click an "Analyze with AI" button and get a detailed report that explains *why* my bot has been performing the way it has over the last quarter.
-   **As a Quant,** I want the AI to identify the market regime (e.g., trending, mean-reverting, volatile) where my strategy has the highest profit factor, so I can consider deploying it only in those conditions.
-   **As a Portfolio Manager,** I want to receive an automated, AI-generated monthly performance review for each of my top 5 bots, so I can quickly understand their recent behavior without digging through logs myself.
-   **As a Developer,** I want the AI to analyze the logs of my losing trades and suggest potential filters or logic changes that could have prevented them.

## 5. Example AI Analysis Output

**Bot:** "BTC RSI Mean Reversion"
**Period:** Last 90 Days

**Executive Summary:**
The bot has been profitable, but its performance is highly dependent on market volatility. It excels during stable, range-bound periods but gives back a significant portion of its profits during high-volatility breakout events.

**Winning Conditions:**
-   The bot's 10 most profitable trades occurred when the 20-period Average True Range (ATR) on the 4-hour chart was below 1.5% of the price.
-   Win rate is highest on Tuesdays and Wednesdays (68%), suggesting it performs well during mid-week, business-hours trading.

**Losing Conditions:**
-   The bot's 5 largest losing trades all occurred immediately following a major news announcement (e.g., CPI release), when volatility spiked.
-   The strategy's profit factor is negative (0.85) on weekends, particularly Sundays.

**Actionable Recommendations:**
1.  **Add a Volatility Filter:** Consider pausing the bot if the 4-hour ATR exceeds 2.5%. This would have avoided 4 of the 5 largest losses.
2.  **Implement a Weekend Filter:** Consider pausing the bot from Friday evening to Monday morning, as its edge appears to diminish during lower-volume weekend periods.

## 6. Dependencies

-   **ft-110-economics-tracking:** The primary source for the trade logs.
-   **ft-020-audit-logging:** Provides the detailed decision logs for deeper analysis.
-   **ft-115-historical-data-management:** Provides the market context (price, volume, volatility) for the period being analyzed.
-   An external LLM API provider (e.g., Google Gemini, Anthropic Claude).
