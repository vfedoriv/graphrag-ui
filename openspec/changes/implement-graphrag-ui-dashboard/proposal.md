## Why

The repository currently has a starter Vite React app and lacks the operational UI needed to manage GraphRAG knowledge workflows. Building a first-pass admin dashboard now enables end-to-end use of the existing backend APIs without backend changes.

## What Changes

- Replace starter UI with an admin dashboard app shell using sidebar navigation and route-based feature pages.
- Implement full frontend workflows for knowledge bases, schemas, documents, and queries against existing `/api/v1` contracts.
- Add a typed manual API client with normalized `ProblemDetail` error handling and domain-specific API modules.
- Add state and form architecture with TanStack Query and React Hook Form + Zod.
- Add test infrastructure and initial coverage for API behavior, cache invalidation, and critical user flows.
- Add production containerization with nginx SPA hosting and `/api` proxying.

## Capabilities

### New Capabilities
- `admin-app-shell-and-navigation`: App layout, sidebar routes, active knowledge base context, and status surfaces derived from existing feature API calls (no dedicated health endpoint).
- `knowledge-base-management`: List/create/update/delete/select knowledge bases and keep selection available across views.
- `schema-management-and-activation`: Registry schema creation/list/detail/validation and activation for selected knowledge base.
- `schema-generation-workflow`: Generate example content, generate YAML, validate/edit YAML, and create schema from generated artifacts.
- `document-ingestion-and-processing`: Upload documents, list knowledge-base documents, trigger processing, and inspect chunks/status.
- `query-authoring-and-execution`: Ask questions, generate/validate/edit/execute Cypher, and display tabular execution results.
- `api-client-and-error-normalization`: Typed HTTP client, request helpers, and shared API error normalization from backend `ProblemDetail`.
- `deployment-and-runtime-proxying`: Vite dev proxy and nginx production proxy/container setup for backend connectivity.

### Modified Capabilities
- None.

## Impact

- Affected code: most of `src/` (app shell, features, shared UI, API layer), plus test config and setup.
- Dependencies: React Router, TanStack Query, React Hook Form, Zod, Tailwind, lucide-react, Vitest, RTL.
- Runtime behavior: browser requests use same-origin `/api` and rely on proxy targets in dev and production containers.
- Backend/API: consumes existing GraphRAG backend endpoints only; no backend contract changes are introduced.
- Backend reference for implementation details: consult backend source at `~/workspace/graphrag` (absolute path `/home/vitaliy/workspace/graphrag`) to confirm REST endpoint behavior, payload contracts, and DTO formats when needed.
- Quality process: each implementation step includes adding or updating tests before moving to the next step.
