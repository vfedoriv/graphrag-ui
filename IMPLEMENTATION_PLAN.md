# GraphRAG UI Implementation Plan

## Summary

Build `graphrag-ui` as a full first-pass React 19 + Vite dashboard for the existing Spring backend in `/home/vitaliy/workspace/graphrag`. The UI will be frontend-only, use the backend's current `/api/v1` REST contracts, avoid backend/CORS changes by proxying API calls in Vite and nginx, and ship as a separate static container.

Selected defaults:

- Scope: full API UI for knowledge bases, schemas, documents, and queries.
- API layer: typed manual TypeScript client based on inspected backend DTOs/controllers.
- UX: resource sidebar app shell.
- Dependencies: React Router, TanStack Query, React Hook Form + Zod, Tailwind CSS, lucide-react, Vitest.
- Auth: out of scope.

## Key Changes

- Replace the starter Vite screen with an admin app shell:
  - Sidebar: `Dashboard`, `Knowledge Bases`, `Schemas`, `Documents`, `Queries`, `Settings`.
  - Header: selected knowledge base, backend status, active schema indicator.
  - Main content: dense dashboard views designed for repeated admin operations.
- Add current frontend tooling:
  - Tailwind CSS via `tailwindcss` + `@tailwindcss/vite`, with `@import "tailwindcss"` in the main stylesheet.
  - React Router v7 in library mode with nested routes under a shared layout.
  - TanStack Query v5 with a single `QueryClientProvider`, query key factories, mutation invalidation, and no global server-state stores.
  - React Hook Form + Zod for create/update forms and request validation.
  - Vitest + jsdom + React Testing Library for component and hook tests.
- Add scripts:
  - `npm run dev`: Vite dev server.
  - `npm run build`: `tsc -b && vite build`.
  - `npm run lint`: ESLint.
  - `npm test`: Vitest watch/run default.
  - `npm run test:run`: CI-style Vitest run.
  - `npm run coverage`: Vitest coverage.
  - `npm run preview`: Vite preview.

## Interfaces & Data Flow

- Client API base:
  - Browser calls same-origin paths by default: `/api/v1/...`.
  - Vite dev proxy forwards `/api` to `VITE_API_PROXY_TARGET`, default `http://localhost:8080`.
  - Production nginx serves static UI and proxies `/api` to `GRAPHRAG_API_URL`, default `http://graphrag:8080`.
- Manual TypeScript API client covers these backend contracts:
  - Knowledge bases: create, list, get, update, delete.
  - Schemas: create, list, get, validate, generate example, generate YAML, activate for a knowledge base.
  - Documents: upload, list by knowledge base, process, list chunks.
  - Queries: generate Cypher, validate Cypher, execute Cypher, ask one-shot question.
- Error handling:
  - Normalize backend `ProblemDetail` into a shared `ApiError`.
  - Show inline field errors where backend returns `errors`.
  - Show request-level failures in page-level alerts/toasts.
  - Keep long-running calls such as document processing and schema/query generation visibly pending.
- Feature pages:
  - Dashboard: backend health/status, selected KB summary, active schema, document status counts, quick actions.
  - Knowledge Bases: list, create, rename, delete, select active working KB.
  - Schemas: list registry schemas, inspect metadata, validate YAML, create schema from YAML, activate schema for selected KB.
  - Schema Generation: two-step workflow: generate/edit example, generate/edit YAML, validate YAML, then create schema.
  - Documents: upload file, list documents, process document, inspect chunks and error messages.
  - Queries: ask prompt, generate Cypher, edit/validate Cypher, execute, inspect rows/columns/validation metadata.

## Implementation Steps

- Set up project foundation:
  - Install dependencies.
  - Configure Tailwind in `vite.config.ts`.
  - Add `src/test/setup.ts`, Vitest config, jsdom setup, and coverage config.
  - Replace starter CSS/assets with dashboard-oriented global styles and Tailwind utilities.
- Build application architecture:
  - Add route tree and layout shell.
  - Add shared UI primitives: buttons, inputs, textarea, select, file input, tabs, dialog/drawer, table, empty state, loading state, error alert, status badge.
  - Add selected knowledge base state persisted in `localStorage`.
- Build API layer:
  - Add DTO types matching backend responses and requests.
  - Add `apiFetch`, JSON helpers, multipart helpers, and `ProblemDetail` parsing.
  - Add domain-specific API modules and TanStack Query hooks.
  - Invalidate related queries after mutations: KB list/detail, schema list, document list, query results as appropriate.
- Build feature views:
  - Implement KB CRUD first because all other workflows depend on selected KB.
  - Implement schema registry and activation.
  - Implement schema generation/validation/create workflow.
  - Implement document upload/process/chunks.
  - Implement query ask/generate/validate/execute workflow.
  - Add settings/status page showing configured API path, proxy expectation, and backend health result.
- Add containerization:
  - Add `Dockerfile` with Node build stage and nginx runtime stage.
  - Add nginx config for SPA fallback plus `/api` proxy.
  - Add example compose file for `graphrag-ui` pointing at an existing `graphrag` backend service URL.

## Test Plan

- Unit tests:
  - API client builds JSON and multipart requests correctly.
  - `ProblemDetail` parsing handles validation, conflict, not found, and generic failures.
  - Zod schemas enforce required frontend fields matching backend constraints.
  - Query key factories and mutation invalidation call the expected keys.
- Component tests:
  - App shell renders navigation and active route states.
  - KB list/create/select flow updates UI after mocked mutation.
  - Schema generation flow requires example before schema generation.
  - Document upload sends multipart data and shows upload/process status.
  - Query workflow displays generated Cypher, validation errors, and execution rows.
- Verification commands:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - Optional manual smoke test with backend running: create/select KB, activate schema, upload/process TXT file, ask a question.

## Assumptions

- Backend remains unchanged; no CORS work is planned.
- The UI targets the current backend contracts found in `/home/vitaliy/workspace/graphrag`.
- Backend processing is synchronous today, so the UI treats process/generate/ask calls as pending HTTP mutations rather than background jobs.
- File upload limit remains backend-controlled at 100 MB.
- Runtime authentication/authorization is intentionally excluded.
- Generated OpenAPI clients are not used in v1; a future drift check can compare manual types against `/v3/api-docs`.
