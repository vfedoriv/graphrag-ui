## Context

The current app is a React 19 + Vite + TypeScript SPA with TanStack Query v5 already installed and used for core knowledge-base, schema list/create/activate, document list/upload/process, and query action mutations. The codebase is feature-oriented and frontend-only; backend REST contracts under `/api/v1` are out of scope for this change.

Current state handling has good foundations but inconsistent ownership:

- Server-backed lists and some mutations use TanStack Query, but schema validation, schema generation, schema get-by-id, and several workflow requests call `schemasApi` imperatively from components.
- Components manually track `isPending`, `error`, and response output for requests that should be represented by query/mutation state.
- Disabled document/chunk queries use placeholder keys and cast nullable ids in `queryFn`, which works only because `enabled` blocks execution.
- Global selected knowledge-base id is persisted in localStorage context but not reconciled against the authoritative knowledge-base list after refresh, delete, or backend changes.
- Some state is truly local draft state, but the app lacks a documented boundary that prevents server data and derived values from being copied into component state unnecessarily.

React guidance emphasizes deriving values during render instead of storing redundant state and using context for shared UI state. TanStack Query guidance treats queries, mutations, and invalidation as the owner of server state and async status.

## Goals / Non-Goals

**Goals:**

- Make server-state ownership consistent across API modules and feature pages.
- Reduce hand-rolled pending/error/result bookkeeping for backend endpoint workflows.
- Keep local state focused on form drafts, selected row ids, active tab state, file handles, confirmation flow, and editable generated text.
- Make selected knowledge-base state durable but reconciled with backend data.
- Improve query-key safety and testability for nullable resource ids.
- Preserve current UI workflows, labels, routes, and backend request contracts.

**Non-Goals:**

- Introducing Redux, Zustand, Jotai, or another global state library.
- Changing backend API paths, payload shapes, or response shapes.
- Reworking visual design or controller-page navigation.
- Adding authentication, authorization, or multi-user state concerns.
- Replacing React Hook Form where it already fits the create knowledge-base form.

## Decisions

### Use TanStack Query as the only owner for backend async state

Feature components should not call `schemasApi.*`, `documentsApi.*`, `knowledgeBaseApi.*`, or `queriesApi.*` directly for user-triggered endpoint workflows. API modules should expose typed `useQuery`/`useMutation` hooks that encapsulate request functions, query keys, invalidation, and cache updates.

Rationale: this aligns with the existing stack and TanStack Query's purpose: fetching, caching, synchronizing, mutating, and invalidating server state. It also removes duplicate manual `isPending`/`error` flags.

Alternative considered: leave one-off imperative calls for operations that are not cached. Rejected because TanStack mutations still provide value for non-cached commands: pending state, error state, reset, retry semantics, devtools compatibility if added later, and uniform tests.

### Treat generated/editable text as local draft state, not server state

Generated schema JSON, query Cypher text, and JSON parameter text may remain in local state because the user edits these values before submitting them to later endpoints. Mutation `data` may seed these drafts after success, but editable fields should not be directly bound to mutation response objects.

Rationale: these values become user-owned drafts once displayed. Keeping them local avoids accidental cache overwrites and preserves edits between tab transitions where `keepPanelsMounted` is intentional.

Alternative considered: store all generated outputs only in mutation `data`. Rejected because users must edit generated content and carry it across related workflow tabs.

### Prefer derived render values over redundant state

Values such as `activeKb`, unsupported schema rows, aggregate pending flags, parsed status labels, and selected entity objects should be derived during render from existing state/query data. State should not mirror values that can be calculated from current props, query results, or drafts.

Rationale: React guidance warns against redundant derived state because it creates synchronization bugs and extra renders.

Alternative considered: memoize most derived values. Rejected as a default; use plain render-time derivation unless a calculation is expensive or creates unstable references passed to memoized children.

### Reconcile persisted selected knowledge-base id with query data

The selected KB provider can continue owning the persisted id, but a small reconciliation layer should clear the selected id when knowledge-base query data has loaded and no matching id exists. This may live in `AppLayout` or a dedicated `SelectedKnowledgeBaseReconciler` rendered under both providers.

Rationale: localStorage is durable UI state, not authoritative server state. Keeping a deleted or inaccessible id active breaks downstream document/query/schema workflows.

Alternative considered: move selected id entirely into TanStack Query cache. Rejected because it is not server data and should remain simple durable UI preference state.

### Add nullable-safe query-key factories

`queryKeys.documents` and `queryKeys.chunks` should support nullable ids through explicit factories such as `documentsByKnowledgeBase(knowledgeBaseId: string | null)` and `documentChunks(documentId: string | null)`, or separate `none` factories. Query functions must guard nullable inputs before calling API functions instead of relying on casts.

Rationale: query keys should be stable and explicit, and query functions should remain type-safe even if options change later.

Alternative considered: keep placeholder array literals inside hooks. Rejected because hidden placeholder keys make tests and invalidation harder to reason about.

### Use local reducer or workflow hooks for complex multi-field client workflows

Where a controller tab has many related local states (schema generation, query authoring), extract a feature-local hook or reducer if it reduces coupling. This is optional for simple forms; it should not add abstraction merely to move lines around.

Rationale: reducers help when multiple state updates represent workflow transitions, while simple `useState` remains appropriate for independent form fields.

Alternative considered: convert all feature pages to reducers. Rejected because that would add boilerplate without improving simpler UI state.

## Risks / Trade-offs

- Refactor churn in feature pages → Mitigate by preserving visible workflows and adding focused regression tests before or alongside changes.
- Overusing TanStack Query for client-only state → Mitigate by keeping form drafts, selected tab, selected file, and editable generated content outside Query.
- Reconciliation clears a selected KB before data is ready → Mitigate by reconciling only after the knowledge-base query has successful data.
- Mutation `reset` behavior may alter visible output timing → Mitigate with tests for success, error, and retry flows in schema/query workflows.
- Query-key changes can break existing invalidation tests → Mitigate by updating `queryKeys.test.ts` first and keeping old invalidation semantics explicit.

## Migration Plan

1. Add state-governance tests and query-key tests that document the intended behavior.
2. Expand API modules with missing query/mutation hooks without changing endpoint functions.
3. Refactor schema workflows to use hooks and remove manual pending/error request flags.
4. Refactor document nullable query keys and row-specific process state to avoid unsafe query functions.
5. Add selected-KB reconciliation and regression tests for stale localStorage/deleted KB cases.
6. Review query authoring JSON parameter flow so invalid JSON prevents validate/execute calls instead of silently sending `{}`.
7. Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build` for final validation.

Rollback is straightforward: each refactor is frontend-only and can be reverted by feature area without backend migration.

## Open Questions

- Should generated schema/query drafts survive route changes, or is current mounted-page lifetime sufficient?
- Should active tab state remain local only, or become URL-addressable in a later navigation improvement?
