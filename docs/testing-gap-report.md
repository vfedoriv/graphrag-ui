# Testing Gap Report

## Coverage Baseline

Run date: 2026-05-12
Command: `npm run coverage`

Baseline summary:
- Statements: 73.94%
- Branches: 64.08%
- Functions: 73.85%
- Lines: 74.16%

Coverage artifacts:
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`

## Priority Gaps Identified

1. Highest remaining under-covered modules:
- `src/features/schemas/SchemasPage.tsx` (complex multi-tab workflows and error branches)
- `src/features/queries/QueriesPage.tsx` (branch-heavy panel behavior)
- `src/features/settings/SettingsPage.tsx` (currently untested)
- `src/main.tsx` (bootstrap path untested)

2. Feature workflows under-covered:
- Schemas tab workflows (validate/get/generate)
- Documents upload/process/chunks flow
- Queries ask/generate/validate/execute flow

3. Tooling/guardrails gaps:
- Coverage dependency was missing before this change
- Shared test setup and fetch stubs were duplicated across tests

## Guardrails

- Coverage command must remain green: `npm run coverage`
- Initial thresholds enforced in `vitest.config.ts`:
- Statements: `45`
- Branches: `40`
- Functions: `45`
- Lines: `45`
- New tests should use shared helpers from `src/test/helpers.tsx` for provider setup and deterministic fetch mocking.

## Completion Checklist

- [x] Coverage tooling installed and configured
- [x] API module tests added for high-risk paths
- [x] Feature workflow tests added for key user flows
- [x] Shared test helper utilities adopted
- [x] Lint/test/coverage all passing
- [x] Baseline metrics captured in this report
