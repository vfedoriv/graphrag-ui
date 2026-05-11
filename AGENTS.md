# Repository Guidelines

## Project Structure & Module Organization

This repository is a React 19 + Vite + TypeScript admin UI for the GraphRAG backend (`/home/vitaliy/workspace/graphrag`). Keep frontend concerns in this repo only; backend API contracts are consumed, not modified here.

Code should be organized by feature, not by file type. Use `src/app` for app shell/router/providers, `src/features/*` for domain modules (`knowledge-bases`, `schemas`, `documents`, `queries`), `src/shared` for reusable UI and utilities, and `src/api` for typed HTTP client code. Static files belong in `public/`; generated build output is `dist/`.

## Build, Test, and Development Commands

Use npm scripts from the project root:

- `npm run dev`: start Vite with HMR.
- `npm run build`: type-check and build production assets.
- `npm run lint`: run ESLint.
- `npm run preview`: serve built assets locally.
- `npm test`, `npm run test:run`, `npm run coverage`: Vitest workflows (add/maintain these scripts as test setup lands).

Dev API traffic should use `/api` and be proxied to backend (`VITE_API_PROXY_TARGET`, default `http://localhost:8080`).

## Coding Style & Naming Conventions

Use TypeScript everywhere. Prefer function components, two-space indentation, single quotes, and no semicolons. Use `PascalCase` for components/types, `camelCase` for functions/variables, and kebab-case for asset filenames.

Model server data with explicit DTO types in `src/api/types.ts` (or feature-local equivalents). Centralize fetch logic and `ProblemDetail` error normalization. For forms, use React Hook Form + Zod; for server state, use TanStack Query with stable query keys and mutation invalidation.

## Testing Guidelines

Use Vitest with `jsdom` and React Testing Library. Co-locate tests as `*.test.ts(x)` next to source files. Prioritize:

- API client behavior (JSON/multipart payloads, error parsing).
- Query/mutation cache behavior.
- Critical user workflows: KB CRUD, schema generation/activation, document upload/process, query ask/execute.

## Commit & Pull Request Guidelines

Use short imperative commit messages (`add schema activation panel`). Keep commits focused and reviewable.

PRs should include:

- What changed and why.
- Validation performed (`npm run lint`, `npm run build`, tests).
- Screenshots/video for UI changes.
- Notes on API assumptions or contract dependencies.

## Security & Configuration Tips

Never commit secrets or local env files. Configure runtime endpoints via env vars (for example `VITE_API_PROXY_TARGET`, `GRAPHRAG_API_URL` in container runtime). Authentication/authorization are currently out of scope; do not add placeholder auth flows without explicit product direction.
