# Feature: ft-001 - Application Framework

**Status:** Proposed
**Priority:** P0 (Absolute Blocker)

## 1. Problem Statement

The project requires a core application structure to host, run, and interact with the trading engine. There is no defined technology stack, repository structure, or deployment platform. Without this foundational feature, there is no "product"—only a collection of backend logic with no way to use it. This feature defines the chassis and operating environment for the entire system.

## 2. Goals

-   Define the primary technology stack for the frontend, backend, and database.
-   Establish a robust monorepo structure to facilitate code sharing and scalability.
-   Define the deployment target and CI/CD strategy.
-   Create the basic application shell for the primary web interface.

## 3. Technology Stack (Decision)

-   **Monorepo Tooling:** A tool like **pnpm workspaces** will be used to manage the monorepo.
-   **Web Application Framework:** **TanStack Start** for the primary `botbox` web app.
-   **Deployment Target:** **Cloudflare Workers**.
-   **Database:** **Cloudflare D1**.
-   **UI Components:** A standard component library like **Shadcn/UI** or **Mantine**.

## 4. Architectural Design: The Monorepo

The project will be structured as a **monorepo** to ensure that code can be easily shared between different parts of the application. This is a critical decision to avoid code duplication and to prepare for future expansion (e.g., mobile apps, standalone services).

The `botbox` application, built with TanStack Start, is just **one package** within this monorepo. It will serve as the primary web interface, but it is not the container for the entire project's logic.

### Proposed Monorepo Structure:

```
/
├── apps/
│   ├── botbox/         # The TanStack Start web application (UI + project API in the future if required)
│   └── mobile-app/     # Future potential mobile application
├── packages/
│   ├── core/           # Shared business logic (e.g., strategy execution, risk management, trades etc.)
│   ├── types/          # Shared TypeScript types and interfaces
│   └── ui/  # Shared React components used by multiple apps
└── package.json        # Root package.json for managing workspaces
```

This structure ensures that critical business logic and types are developed independently and can be imported by any application, be it the web UI, a mobile app, or a command-line tool.

## 5. Key Implementation Details

-   **Repository Setup:** The repository will be initialized as a pnpm workspace.
-   **`botbox` Application:** The TanStack Start application will be created inside the `apps/botbox` directory.
-   **Shared Packages:** Initial packages for `core-logic` and `types` will be created to establish the pattern of code sharing.
-   **Database Migrations:** A tool like `drizzle-kit` will be used to manage D1 database schema migrations.
-   **Wrangler Configuration:** The `wrangler.toml` file will be configured for the `botbox` application.

## 6. User Stories

-   **As a Developer,** I want a monorepo with clearly defined packages, so I can develop shared logic (like a new risk rule) in one place and use it in both the web and future mobile apps.
-   **As a Developer,** I want the `botbox` web application to be a standalone package, so its dependencies and build process don't conflict with other parts of the system.
-   **As an Operator,** I want to be able to deploy the `botbox` application from the monorepo without needing to deploy every other package.

## 7. Dependencies

-   None. This is the foundational feature upon which all others depend.