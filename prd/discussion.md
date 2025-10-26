# Discussion Points & Open Questions

*Date: 2025-10-26*

This document outlines critical features that appear to be missing from the current PRD, along with clarifying questions. The focus is on operational, security, and foundational aspects of the platform, excluding strategy-specific details.

## 1. Missing Critical Features

### a. Configuration Management
- **Gemini:** Bot and strategy configurations (risk limits, parameters, etc.) need to be stored, versioned, and managed. There is no feature defining how this is handled.
- **You:** We have bot management in `prd/features/ft-100-bot-management` for listing and updating, but you are right that we lack strategy management. This is a high-priority item.
- **Action:** A new feature, `ft-118-strategy-management`, will be created.

### b. Database Management & Disaster Recovery
- **Gemini:** The platform relies on Cloudflare D1, but there are no features covering its management, including schema migrations, backups, and disaster recovery.
- **You:** This is not critical for the initial phase, as we are relying on a managed service.
- **Action:** This will be deferred for now.

### c. CI/CD and Deployment
- **Gemini:** The PRD does not specify how the application will be tested, built, and deployed to the Cloudflare Workers environment.
- **You:** We should add a feature for the CI/CD process, but it doesn't need to be overly detailed. It should specify the use of Vitest for testing.
- **Action:** A new feature, `ft-002-cicd-and-deployment`, will be created.

### d. User Roles and Permissions
- **Gemini:** `ft-005-user-authentication` defines user identity, but not what users are allowed to do. A single-user system is implied.
- **You:** Correct, there will be no concept of roles for now, as I will be the only user.
- **Action:** No feature for Role-Based Access Control (RBAC) is needed at this stage.

## 2. Questions for Clarification

### 1. Security of API Keys
- **Gemini:** How should exchange API keys be securely stored and accessed by the serverless functions?
- **You:** We should use Cloudflare's native capabilities. Please research and document how Cloudflare supports secret management.
- **Gemini's Findings:**
    Cloudflare provides a secure, built-in solution for this called **Cloudflare Secrets**. We can add encrypted API keys to each Worker via the `wrangler` CLI or the Cloudflare dashboard. These secrets are encrypted at rest and in transit and are exposed to the code as environment variables (e.g., `env.BINANCE_API_KEY`). This avoids hard-coding keys in the source code. For local development, we will use a `.dev.vars` file, which will be added to `.gitignore` to prevent accidental commits of secrets. This approach is secure, standard practice for Cloudflare Workers, and does not require any third-party vault services.
- **Action:** The implementation will use Cloudflare Secrets for all API key management. yes awesome.

### 2. Initial User Onboarding
- **Gemini:** What is the process for the first user (the administrator) to gain access to the system?
- **You:** This is not needed, as I will be the only user.
- **Action:** No user onboarding feature is required.

### 3. External API Rate Limiting
- **Gemini:** How will the system handle and respect rate limits imposed by exchange APIs to avoid being banned?
- **You:** This is a valid concern. We should implement a solution, but it is not a top priority for the initial version.
- **Action:** A new feature, `ft-015-api-rate-limiting`, will be created with a lower priority.

### 4. Testing Framework
- **Gemini:** What is the strategy for automated software testing (unit, integration, etc.)?
- **You:** We will use Vitest for unit testing. The primary focus for testing is on the trading strategy backtester.
- **Action:** The `ft-002-cicd-and-deployment` feature will specify Vitest as the testing framework.

### 5. System Scalability
- **Gemini:** What are the long-term scalability goals (e.g., supporting 100+ bots)?
- **You:** The system is not designed for high-frequency scalping, so the initial architecture should handle 50+ bots without issues.
- **Action:** No specific scalability features are needed at this time.
