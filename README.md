# GraphRAG UI

Frontend admin dashboard for operating the GraphRAG backend REST API.

## Overview

GraphRAG UI is a React 19 + Vite + TypeScript single-page app for day-to-day GraphRAG administration. It runs as a separate frontend service and calls the backend through same-origin `/api/v1/*` paths.

Backend repository and canonical system documentation:

- [GraphRAG backend repository](https://github.com/vfedoriv/graphrag)
- [Canonical GraphRAG documentation portal](https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/index.md)

Implemented workflows:
- Knowledge bases: create, list, rename, delete, and select the active working KB.
- Schemas: list registry schemas, validate JSON, generate example data, generate schema JSON, create schemas, and activate a schema for a KB.
- Schema builder: visually create and edit schema nodes, relationships, and properties.
- Schema drafts: discover, analyze, review, evaluate, publish, and release draft schemas.
- Documents: upload files to a KB, list uploads, process documents, manage parser options, and inspect processing state.
- Chunking: edit the global strategy, explore bounded chunk hierarchies, and preview, run, monitor, and retry explicit reprocessing plans.
- Advanced Search: check readiness, submit durable evidence-grounded runs, monitor or cancel focused work, inspect cited results and diagnostics, and browse retained history.
- Queries: ask a one-shot question, generate Cypher, validate Cypher, execute Cypher, and inspect result rows.
- AI providers: create and manage reusable provider profiles and knowledge-base assignments.
- Settings: inspect and edit runtime settings, manage AI profiles, and review proxy/runtime context.
- App shell: dashboard, controller pages with endpoint tabs, active KB selector, shared status badges, and responsive navigation.

Authentication and authorization are currently out of scope.

## Documentation

Canonical cross-stack behavior, backend contracts, persistence, and operations are owned by the backend repository:

- [Canonical backend documentation portal](https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/index.md) — backend-owned system documentation.
- [Runtime Swagger UI](http://localhost:8080/swagger-ui/index.html) and [OpenAPI JSON](http://localhost:8080/v3/api-docs) — exhaustive contract for the running backend.

Frontend controls, screenshots, browser behavior, caveats, and implementation maps are maintained here:

- [Advanced Search overview](docs/advanced-search/README.md) and [reference](docs/advanced-search/reference.md) — frontend-owned companion guide.
- [Chunking overview](docs/chunking/README.md) and [reference](docs/chunking/reference.md) — frontend-owned companion guide.
- [Testing gap report](docs/testing-gap-report.md) — frontend testing baseline and guidance.

## Tech Stack

- React 19
- Vite 8
- TypeScript 6
- React Router 7
- TanStack Query 5
- React Hook Form + Zod
- Tailwind CSS 4 via `@tailwindcss/vite`
- Vitest 4 + React Testing Library
- Docker + nginx runtime

## Requirements

- Node.js 22+
- npm 10+
- Optional: Docker for containerized runtime
- Optional: GraphRAG backend running on `http://localhost:8080` for local integration testing

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The Vite dev server listens on:

```text
http://localhost:8333
```

By default, browser requests to `/api/*` are proxied to:

```text
http://localhost:8080
```

Override the backend target when needed:

```bash
VITE_API_PROXY_TARGET=http://localhost:8080 npm run dev
```

## Scripts

- `npm run dev`: start Vite with HMR.
- `npm run build`: type-check and build production assets.
- `npm run lint`: run ESLint.
- `npm run preview`: preview the built app.
- `npm test`: run Vitest in watch mode.
- `npm run test:run`: run Vitest once.
- `npm run coverage`: run Vitest coverage with thresholds.
- `npm run test:e2e`: run Playwright browser tests against a local Vite server with mocked `/api/v1` responses.
- `npm run test:e2e:ui`: run Playwright in interactive UI mode.
- `npm run test:e2e:headed`: run Playwright with a visible browser.

## Project Structure

```text
src/
  app/          app shell, providers, router
  api/          typed API client, DTO types, query keys, domain API modules
  features/     routed workflows such as schemas, drafts, documents, chunking, search, queries, providers, and settings
  shared/       shared UI, state, and helpers
  test/         test setup and render/fetch helpers

docs/           reports and project documentation
nginx/          production nginx config template
openspec/       current specs and archived completed changes
public/         static assets
```

## API Proxying

The frontend always calls same-origin `/api/v1/*` endpoints.

Local development:
- Vite proxies `/api/*` to `VITE_API_PROXY_TARGET`.
- Default target: `http://localhost:8080`.

Container runtime:
- nginx serves the SPA and proxies `/api/*` to `GRAPHRAG_API_URL`.
- Compose example default: `http://graphrag:8080`.

## Docker

Build the image:

```bash
docker build -t graphrag-ui:local .
```

Run the container:

```bash
docker run --rm -p 8333:8333 -e GRAPHRAG_API_URL=http://host.docker.internal:8080 graphrag-ui:local
```

Or use the example compose file:

```bash
docker compose -f compose.ui.example.yaml up --build
```

## Testing & Validation

Recommended validation for substantial changes:

```bash
npm run lint
npm run test:run
npm run test:e2e
npm run coverage
npm run build
```

The current coverage baseline and priority gaps are tracked in the [testing gap report](docs/testing-gap-report.md).

Playwright tests start or reuse the Vite app on `127.0.0.1:8333` and do not require a running GraphRAG backend because they mock same-origin `/api/v1` traffic.

Test coverage includes API client behavior, query keys, shared UI, app routing, Playwright browser navigation, and feature workflow tests for knowledge bases, schemas, documents, and queries.

## Notes

- No dedicated backend health endpoint is required by the UI.
- Backend availability is inferred from existing feature API request outcomes.
- Generated build output is `dist/`; coverage output is `coverage/`.
- Historical planning has been replaced by implemented code and archived OpenSpec changes under `openspec/changes/archive`.
