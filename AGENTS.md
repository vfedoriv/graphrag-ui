# Repository Guidelines

## Project Overview

This repository is the implemented React 19 + Vite + TypeScript admin UI for the GraphRAG backend in `/home/vitaliy/workspace/graphrag`. It is a frontend-only service that consumes the backend REST API under `/api/v1`; do not modify backend contracts from this repo.

The app currently provides controller-oriented pages for:
- Knowledge base CRUD and active knowledge base selection.
- Schema registry, JSON validation, generation, creation, and activation.
- Document upload, processing, listing, and chunk inspection.
- Query generation, validation, execution, and one-shot ask flows.
- Settings/proxy visibility and dashboard navigation.

Authentication and authorization remain out of scope unless product direction changes.

## Project Structure & Module Organization

Organize code by feature, not by file type:
- `src/app`: router, providers, and app shell layout.
- `src/api`: typed HTTP client, DTOs, query keys, and domain API modules.
- `src/features/*`: feature pages for dashboard, knowledge bases, schemas, documents, queries, and settings.
- `src/shared`: reusable UI primitives, shared state, and utilities.
- `src/test`: shared test setup and helpers.
- `public`: static assets.
- `nginx`: production SPA and API proxy configuration.
- `docs`: project reports such as the testing gap report.
- `openspec`: current and archived OpenSpec specs and change history.

Generated outputs such as `dist/` and `coverage/` should not be treated as source.

## Build, Test, and Development Commands

Use npm scripts from the project root:
- `npm run dev`: start Vite with HMR on port `8333`.
- `npm run build`: type-check with `tsc -b` and build production assets.
- `npm run lint`: run ESLint.
- `npm run preview`: serve built assets locally.
- `npm test`: run Vitest in watch mode.
- `npm run test:run`: run Vitest once.
- `npm run coverage`: run Vitest coverage with configured thresholds.

Development API traffic must use same-origin `/api` paths. Vite proxies `/api/*` to `VITE_API_PROXY_TARGET`, defaulting to `http://localhost:8080`.

## Runtime & Deployment

The Docker image builds static assets with Node 22 and serves them with nginx on port `8333`. Runtime API proxying is controlled by `GRAPHRAG_API_URL` in the nginx template.

Use `compose.ui.example.yaml` as the minimal compose reference for running this UI beside an existing `graphrag` backend service.

## Coding Style & Naming Conventions

Use TypeScript everywhere. Prefer function components, two-space indentation, single quotes, and no semicolons. Use `PascalCase` for components/types, `camelCase` for functions/variables, and kebab-case for asset filenames.

Model server data with explicit DTO types in `src/api/types.ts` or feature-local equivalents. Centralize fetch behavior through `src/api/client.ts`, including `ProblemDetail` normalization. Use TanStack Query for server state with stable keys from `src/api/queryKeys.ts`; invalidate related queries after mutations.

For UI work, preserve the existing visual direction: controller pages, endpoint tabs, explicit field labels, output previews, and responsive layouts. Use shared primitives from `src/shared/ui` before adding new components.

## Testing Guidelines

Use Vitest with `jsdom` and React Testing Library. Co-locate tests as `*.test.ts(x)` next to source files unless shared helpers belong in `src/test`.

Prioritize tests for:
- API client behavior, including JSON payloads, multipart uploads, empty responses, and `ProblemDetail` parsing.
- Query key and mutation invalidation behavior.
- Critical workflows: KB CRUD, schema generation/activation, document upload/process/chunks, query ask/generate/validate/execute.
- Shared UI states such as disabled, hover/press, empty, pending, and error states.

Maintain `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build` as the normal validation set for substantial changes. Current coverage baseline and gaps are documented in `docs/testing-gap-report.md`.

## OpenSpec Workflow

OpenSpec artifacts are the source of historical product decisions. Archived changes under `openspec/changes/archive` document completed implementation work. For new behavior or contract changes, add or update OpenSpec specs before implementation when the change is non-trivial.

## Commit & Pull Request Guidelines

Use short imperative commit messages such as `add schema activation panel`. Keep commits focused and reviewable. Do not mention in commit messages "openspec" unless the user explicitly asks about it.

PRs should include:
- What changed and why.
- Validation performed, especially `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build` when applicable.
- Screenshots or video for UI changes.
- Notes on API assumptions or contract dependencies.

## Security & Configuration Tips

Never commit secrets or local env files. Configure runtime endpoints through environment variables such as `VITE_API_PROXY_TARGET` for Vite and `GRAPHRAG_API_URL` for nginx. Do not add placeholder auth flows or fake security controls without explicit product direction.
