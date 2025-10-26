# Repository Guidelines

## Project Structure & Module Organization
- Root workspace manages `apps/*` and `packages/*`; run tooling from the repository root.
- `apps/web` hosts the React Router web client built with Vite; static assets live in `apps/web/public`.
- `apps/mobile` contains the React Native app with tests in `apps/mobile/__tests__`.
- `packages/` is reserved for reusable domain modules; start new packages in `packages/<feature-kebab>`.
- Product artifacts stay in `prd/`, organized by PRD → feature → story for clear traceability.
- Use shared TS types from `packages/types` folder.

## Build, Test, and Development Commands
- `npm run dev:web` launches the web client with live reload.
- `npm run dev:mobile` starts the Metro bundler; pair with `npm run ios` or `npm run android` from `apps/mobile`.
- `npm run build:web` and `npm run build:mobile` emit production bundles for deployment pipelines.
- `npm run test --workspaces` executes every workspace suite; add `-- --watch=false` if a script expects CI mode.
- `npm run test --workspace=apps/mobile` runs the mobile Jest suite; add a web test script before merging new React UI.
- `npm run lint` enforces linting across all workspaces before merge.

## Coding Style & Naming Conventions
- Write strict TypeScript end to end; never introduce the `any` type and keep files under 300 lines.
- Use kebab-case for filenames (`account-overview.tsx`) and PascalCase for exported components (`AccountOverview`).
- Prefer feature-first folder slices and extract shareable utilities into `packages/`.
- Follow padding-line-between-statements spacing and rely on workspace formatters (`eslint`, `prettier`) before committing.

## Testing Guidelines
- Co-locate tests next to source (`feature-x.ts` alongside `feature-x.test.ts`) and mirror suffixes.
- The web app should adopt Vitest with React Testing Library; the mobile app must use Jest for unit testing.
- Group scenarios with `describe`/`it`, use `vi.mocked` or `jest.mocked`, and focus assertions on user outcomes.
- Run targeted suites via workspace flags (`npm run test --workspace=apps/mobile`); mirror this pattern when the web test script is defined.

## Commit & Pull Request Guidelines
- Use short, imperative commits (`feat: add transfer workflow`), bundle only related changes, and include validation commands in the body.
- Open PRs with a concise summary, linked issue or PRD reference, screenshots for UI adjustments, and a checklist covering build, test, and lint status.
- Request review once acceptance criteria in the relevant story markdown are satisfied and all subtasks are checked off.

## Security & Configuration Tips
- Store sensitive keys in environment files ignored by Git (`apps/web/wrangler.jsonc`, mobile `.env` variants); never hard-code credentials.
