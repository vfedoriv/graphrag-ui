# GraphRAG UI

Frontend admin dashboard for GraphRAG backend workflows.

## Overview

This app is a React 19 + Vite + TypeScript UI for managing:
- Knowledge bases
- Schemas (including generation/validation/activation)
- Documents (upload/process/chunks)
- Queries (generate/validate/execute/ask)

Backend source for API contract reference:
- `~/workspace/graphrag` (`/home/vitaliy/workspace/graphrag`)

## Tech Stack

- React 19
- Vite 8
- TypeScript
- React Router
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS (`@tailwindcss/vite`)
- Vitest + React Testing Library

## Requirements

- Node.js 22+
- npm 10+

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Frontend dev server default port: `8333`

By default, frontend calls `/api/v1/*` and Vite proxies `/api/*` to:
- `http://localhost:8080`

Override proxy target:

```bash
VITE_API_PROXY_TARGET=http://localhost:8080 npm run dev
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - type-check + production build
- `npm run lint` - ESLint
- `npm run preview` - preview built app
- `npm test` - Vitest watch
- `npm run test:run` - Vitest single run
- `npm run coverage` - Vitest coverage

## Project Structure

```text
src/
  app/          # app shell, providers, router
  api/          # typed API client, DTO types, query keys, domain API modules
  features/     # feature pages (dashboard, kb, schemas, documents, queries, settings)
  shared/       # shared UI/state/helpers
  test/         # test setup
```

## Docker

Build image:

```bash
docker build -t graphrag-ui:local .
```

Run container:

```bash
docker run --rm -p 8333:8333 -e GRAPHRAG_API_URL=http://host.docker.internal:8080 graphrag-ui:local
```

Nginx serves SPA and proxies `/api/*` using `GRAPHRAG_API_URL`.

Example compose file:
- `compose.ui.example.yaml`

## Testing & Validation

```bash
npm run lint
npm run test:run
npm run build
```

## Notes

- No dedicated dashboard health endpoint is used.
- Backend availability is inferred from existing feature API request outcomes.
