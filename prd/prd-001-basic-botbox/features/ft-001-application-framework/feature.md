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
-   Support a local development environment for rapid iteration.

## 3. Technology Stack (Decision)

-   **Monorepo Tooling:** A tool like **pnpm workspaces** will be used to manage the monorepo.
-   **Web Application Framework:** **TanStack Start** for the primary `botbox` web app.
-   **Deployment Target:** **Cloudflare Workers**.
-   **Database:** **Cloudflare D1**.
-   **UI Components:** A standard component library like **Shadcn/UI**.

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

## 8. Implementation Status

### Completed Setup

-   **Monorepo Conversion:** Project restructured into a pnpm monorepo with `apps/botbox`, `packages/core`, `packages/types`, and `packages/ui` directories. Root `package.json` and `pnpm-workspace.yaml` created.
-   **Husky Pre-commit Hooks:** Husky installed and configured with a `pre-commit` hook to run `pnpm --filter=botbox precommit`.
-   **Drizzle ORM Setup:** Drizzle ORM and Drizzle Kit installed in `apps/botbox`. `drizzle.config.ts` created, and a basic Drizzle schema (`instruments`, `bots`, `bot_instruments`) defined in `apps/botbox/src/db/schema.ts`.
-   TanStack Start initialized with React 19 and TypeScript
-   Vite build system configured with Cloudflare Workers plugin
-   ESLint configured with:
    -   TypeScript ESLint with type-aware linting
    -   React and React Hooks plugins
    -   JSX Accessibility plugin
    -   Custom padding-line-between-statements rule for code style
    -   Flat config format (modern ESLint)
-   Prettier configured for consistent code formatting
-   Vitest configured with:
    -   React Testing Library integration
    -   jsdom environment for browser-like testing
    -   Coverage reporting with v8 provider
    -   Co-located test files support
-   Cloudflare D1 database binding configured in wrangler.jsonc
-   Package.json scripts added for:
    -   Testing: `test`, `test:watch`, `test:coverage`
    -   Linting: `lint`, `lint:fix`
    -   Formatting: `format`, `format:check`
    -   Type checking: `typecheck`
    -   Database operations: `db:create`, `db:migrations:create`, `db:migrations:apply`, `db:migrations:apply:local`
    -   Pre-commit hook: `precommit` (format, lint, typecheck)

### Key Configuration Files

-   `/package.json` (root) - Monorepo package.json
-   `/pnpm-workspace.yaml` (root) - pnpm workspace configuration
-   `/.husky/pre-commit` - Husky pre-commit hook
-   `/apps/botbox/vite.config.ts` - Vite build configuration with Vitest setup
-   `/apps/botbox/eslint.config.js` - ESLint flat config with TypeScript and React rules
-   `/apps/botbox/.prettierrc` - Prettier formatting rules
-   `/apps/botbox/wrangler.jsonc` - Cloudflare Workers and D1 database configuration
-   `/apps/botbox/tsconfig.json` - TypeScript compiler options with path aliases
-   `/apps/botbox/src/test-setup.ts` - Vitest setup file for React Testing Library
-   `/apps/botbox/drizzle.config.ts` - Drizzle Kit configuration
-   `/apps/botbox/src/db/schema.ts` - Drizzle database schema

## 9. To-Do List (Cloudflare D1 Database Setup)

1.  **Create D1 Database:** Manually create a D1 database in your Cloudflare account. You can do this via the Cloudflare dashboard or by running `npx wrangler d1 create <YOUR_DATABASE_NAME>` in your terminal (from the `apps/botbox` directory).
2.  **Update `wrangler.jsonc`:** Once the database is created, you will receive a `database_id`. Update the `database_id` field in `/apps/botbox/wrangler.jsonc` with this ID.
3.  **Generate First Migration:** From the `apps/botbox` directory, run `pnpm db:migrations:create` to generate the initial migration based on the Drizzle schema.
4.  **Apply Migration Locally:** To apply the migration to your local D1 development database, run `pnpm db:migrations:apply:local` from the `apps/botbox` directory.
5.  **Apply Migration to Production (Optional):** To apply the migration to your live D1 database, run `pnpm db:migrations:apply` from the `apps/botbox` directory (after configuring your Cloudflare account for deployment).
