# Feature: ft-005 - User Authentication

**Status:** Proposed
**Priority:** P0 (Critical Security Prerequisite)
**Tier:** 0
**Depends On:** ft-001-application-framework

## 1. Problem Statement

The trading system will manage sensitive information (API keys) and control real financial capital. It is therefore essential that access is restricted to authorized users. The system currently has no concept of user identity or access control, leaving it completely open and insecure.

## 2. Goals

-   To implement a secure and user-friendly authentication system.
-   To ensure that all actions within the system are tied to an authenticated user identity.
-   To provide a session management mechanism that keeps users logged in securely.
-   To avoid the security risks and development overhead of building a password-based system from scratch.

## 3. Chosen Authentication Method (Decision)

-   **Method:** **Magic Link Authentication** (or a similar passwordless OAuth provider).
-   **Implementation:** A library such as nextauth or openauth will be used. These are well-suited for serverless environments like Cloudflare Workers.

-   **Rationale:**
    -   **Passwordless:** Magic Link authentication is highly secure as it eliminates the risk of password theft and reuse. The user's email inbox becomes the secure vault.
    -   **User-Friendly:** The login process is simple and frictionless. The user enters their email, clicks a link, and they are in.
    -   **Fast Implementation:** Using a trusted open-source library or managed service is significantly faster and more secure than building a custom authentication solution.

## 4. Key Implementation Details

-   **Login Flow:**
    1.  A user navigates to the login page and enters their email address.
    2.  The application sends an API request to the backend.
    3.  The backend generates a secure, single-use token and sends an email to the user containing a link with this token.
    3.1. We use Cloudflare's ability to send emails or we use Resend free tier
    4.  The user clicks the link in their email.
    5.  The application verifies the token, establishes a user session (e.g., via a secure, HTTP-only cookie), and redirects the user to the main dashboard.
-   **Session Management:** The chosen auth library will handle the creation, validation, and expiration of user sessions.
-   **Protected Routes:** The application framework (`ft-001`) will be configured so that all pages except the login page are protected and require an active user session to access.
-   **User Profile:** A `Users` table will be created in the Cloudflare D1 database to store basic user information (e.g., `id`, `email`, `created_at`).

## 5. User Stories

-   **As a User,** I want to log in to the application by entering my email and clicking a link, so I don't have to remember another password.
-   **As a User,** I want the application to keep me logged in between visits, so I don't have to re-authenticate every time I open my browser.
-   **As an Administrator,** I want to ensure that only authorized users can access the trading dashboard, to prevent any unauthorized access to funds or strategies.

## 6. Dependencies

-   **ft-001-application-framework:** This feature is built directly into the application shell.
-   An email sending service (many auth libraries have this built-in, or a service like Mailgun/SendGrid can be used).
