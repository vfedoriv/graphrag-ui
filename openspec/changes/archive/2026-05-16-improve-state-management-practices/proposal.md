## Why

The app already uses TanStack Query for core list and mutation flows, but state ownership is inconsistent across feature pages. Several endpoint workflows bypass Query hooks, duplicate pending/error/result state manually, and keep global knowledge-base selection as local persisted context that can drift from backend data.

React 19 guidance favors minimal, non-redundant UI state and deriving values during render where possible. TanStack Query v5 is the right owner for server state, mutations, invalidation, and async status, so aligning the app around those boundaries will reduce synchronization bugs and make controller workflows easier to test.

## What Changes

- Define explicit frontend state ownership rules for this app: server state in TanStack Query, form drafts in local/form state, durable global selection in a small UI-state layer reconciled against server data.
- Convert imperative API calls in schema workflows into typed query/mutation hooks so pending, error, result, and retry behavior is consistent with the rest of the app.
- Replace placeholder disabled-query keys with stable nullable query-key factories and no unsafe type assertions in query functions.
- Reconcile selected knowledge-base state when the selected id no longer exists in the server-backed knowledge-base list.
- Review page-local state for redundant or derived values and remove duplicated state where render-time derivation or mutation state is sufficient.
- Add tests that cover state ownership boundaries, query key behavior, mutation invalidation, selected knowledge-base reconciliation, and schema workflow async states.

## Capabilities

### New Capabilities
- `frontend-state-governance`: Defines app-wide requirements for React local state, shared UI state, and TanStack Query server-state ownership.

### Modified Capabilities
- `api-client-and-error-normalization`: API modules must expose typed TanStack Query hooks for backend endpoint workflows rather than requiring feature components to call API functions imperatively.
- `admin-app-shell-and-navigation`: Global knowledge-base selection must be reconciled against server-backed knowledge-base data so stale persisted ids do not remain active.
- `schema-management-and-activation`: Schema validation and get-by-id workflows must use shared async state handling and preserve visible workflow results/errors consistently.
- `schema-generation-workflow`: Schema generation endpoints must use mutation hooks with consistent pending/error/result state rather than ad hoc component-managed request flags.
- `document-ingestion-and-processing`: Document queries and row-level processing state must use stable query keys and avoid unsafe query functions for disabled queries.
- `query-authoring-and-execution`: Query authoring workflows must avoid derived-state bugs when JSON parameters are invalid and must gate endpoint submission on valid payload state.

## Impact

- Affected source areas: `src/api/*`, `src/shared/state/*`, `src/app/AppLayout.tsx`, `src/app/providers.tsx`, and feature pages under `src/features/*`.
- No backend API contract changes are required.
- No new runtime dependency is expected; changes should use React 19, TanStack Query v5, React Hook Form where already appropriate, and existing shared UI primitives.
- Tests should be updated or added in co-located Vitest/RTL suites, with existing coverage commands remaining valid.
