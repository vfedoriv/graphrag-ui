## Context

The app is a React 19 + Vite single-page admin UI with controller pages for dashboard, knowledge bases, schemas, documents, queries, and settings. It already uses Vitest for component and API tests and has `@playwright/test` plus `playwright.config.ts`, but the current Playwright suite targets `https://playwright.dev/` and does not exercise this repository.

The browser suite must run without a live GraphRAG backend. API traffic should remain same-origin under `/api/v1`, and tests should intercept those requests with deterministic fixtures so failures indicate frontend regressions, not backend availability.

## Goals / Non-Goals

**Goals:**
- Run Playwright against the local Vite app on the existing development port.
- Cover navigation, global knowledge-base selection, and representative controller workflows in real browser contexts.
- Mock `/api/v1` responses per test so the suite is deterministic and safe for CI.
- Add npm scripts that make headless and interactive Playwright execution discoverable.
- Execute the suite during implementation and fix any config, selector, mock, or UI issues that prevent reliable execution.

**Non-Goals:**
- Do not introduce authentication or authorization flows.
- Do not require a running GraphRAG backend for Playwright tests.
- Do not change backend API contracts from this frontend repository.
- Do not replace existing Vitest component/API coverage; Playwright covers cross-page browser behavior that unit tests cannot validate as directly.

## Decisions

- Use Playwright route interception instead of backend test containers. This keeps browser tests fast, deterministic, and compatible with the frontend-only repository while still validating real network call paths from the UI.
- Configure `webServer` to run `npm run dev -- --host 127.0.0.1 --port 8333` and set `baseURL` to `http://127.0.0.1:8333`. This matches the documented dev port and avoids external URLs.
- Replace the starter external tests rather than keeping them. Tests that depend on `playwright.dev` add network flakiness and do not validate project behavior.
- Start with high-signal workflows: shell navigation, global knowledge-base selector, knowledge-base CRUD visibility, schema validation/activation, document upload/chunk viewing, and query ask/generate/validate/execute flows. These mirror existing controller priorities and catch integration regressions across routing, forms, state, and API normalization.
- Prefer accessible locators and existing `data-testid` hooks. If a workflow is not reliably automatable, add targeted labels or test IDs without changing user-facing contracts.
- Keep Playwright fixtures close to tests initially. If fixtures grow, extract helpers under `tests/fixtures` or `tests/support` during implementation.

## Risks / Trade-offs

- Browser tests can become brittle if they depend on layout text too heavily → Prefer roles, labels, and stable `data-testid` selectors for tab panels and output regions.
- API mocks may drift from backend DTOs → Reuse existing frontend DTO shapes and keep fixtures minimal but realistic.
- Full cross-browser execution can be slow locally → Provide a default script that runs headless Playwright and allow project selection for focused debugging.
- File upload flows need synthetic files → Use Playwright `setInputFiles` with in-memory buffers or small test fixtures, avoiding committed large files.
