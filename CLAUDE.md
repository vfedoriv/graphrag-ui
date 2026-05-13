# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server on http://localhost:8333
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run test:run     # Vitest once (CI mode)
npm test             # Vitest watch mode
npm run coverage     # Vitest with coverage thresholds
```

Run a single test file:
```bash
npx vitest run src/api/client.test.ts
```

Validation set for substantial changes: `npm run lint && npm run test:run && npm run coverage && npm run build`

## Architecture

**Single-page app** — React 19 + Vite + TypeScript, served from nginx in production. All API traffic goes through same-origin `/api/v1/*` (proxied to `VITE_API_PROXY_TARGET` in dev, `GRAPHRAG_API_URL` in Docker).

### Module layout

```
src/
  app/           providers, router, AppLayout (app shell with nav)
  api/           apiFetch client, DTO types, queryKeys, domain modules
  features/      one directory per page/feature
  shared/        reusable UI primitives, shared state, lib utilities
  test/          renderWithProviders, stubFetch, jsonResponse helpers
```

### Data flow

1. **`src/api/client.ts`** — `apiFetch<T>` is the single fetch wrapper. It sets headers, handles 204/empty bodies, and normalizes all errors to `ApiError` via `ProblemDetail` parsing.
2. **`src/api/types.ts`** — all DTO types live here (or in feature-local files for one-off shapes).
3. **`src/api/queryKeys.ts`** — all TanStack Query cache keys. Invalidate via these keys after mutations.
4. **`src/api/{knowledgeBases,schemas,documents,queries}.ts`** — domain API modules exporting `useQuery`/`useMutation` hooks built on `apiFetch`.
5. **`src/shared/state/selectedKnowledgeBase.tsx`** — active KB selection, persisted to `localStorage` under `graphrag.selectedKnowledgeBase`, provided via `SelectedKnowledgeBaseProvider`.
6. **`src/app/providers.tsx`** — wraps `QueryClientProvider` + `SelectedKnowledgeBaseProvider`; applied at the root in `main.tsx`.

### UI patterns

Feature pages use `ControllerPage` (title + top-section panel + optional `EndpointTabs`). Each tab maps to one API endpoint. Always use primitives from `src/shared/ui` before adding new components.

### Testing patterns

Tests use `renderWithProviders` from `src/test/helpers.tsx` to mount with both `QueryClientProvider` and `SelectedKnowledgeBaseProvider`. Use `stubFetch` to mock `fetch` globally; use `jsonResponse`/`textResponse` helpers to build mock responses. Test files are co-located with source (`*.test.ts(x)`) except shared helpers in `src/test/`.

## Style conventions

TypeScript everywhere — no `any`. Two-space indentation, single quotes, no semicolons. `PascalCase` for components/types, `camelCase` for functions/variables, kebab-case for filenames.

## Environment

- Backend API reference: `/home/vitaliy/workspace/graphrag`
- Dev proxy default: `http://localhost:8080`
- Docker runtime env var: `GRAPHRAG_API_URL`
- Auth/authorization: out of scope
