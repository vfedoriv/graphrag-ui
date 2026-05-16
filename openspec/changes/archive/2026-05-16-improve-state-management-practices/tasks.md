## 1. Query Keys And API Hooks

- [x] 1.1 Update `src/api/queryKeys.ts` with explicit nullable-safe factories for documents and chunks, and update query-key tests.
- [x] 1.2 Refactor `useDocumentsQuery` and `useDocumentChunksQuery` so disabled queries use safe keys and never call API functions with coerced null ids.
- [x] 1.3 Add schema API hooks for get-by-id, validate, generate example, generate example from file, generate JSON, and generate JSON from file.
- [x] 1.4 Add or update API hook tests for schema mutation/query state, request payloads, and invalidation behavior where applicable.

## 2. Global Selection Reconciliation

- [x] 2.1 Add a selected knowledge-base reconciliation layer that clears persisted selection only after the knowledge-base list loads successfully and does not contain the selected id.
- [x] 2.2 Add regression tests for stale persisted selection, valid persisted selection, deleted selected knowledge base, loading state, and failed list load.

## 3. Schema Workflow State Refactor

- [x] 3.1 Refactor schema validation and get-by-id tabs to consume API-module hooks instead of calling `schemasApi` directly from component event handlers.
- [x] 3.2 Refactor schema example and schema JSON generation components to consume mutation hooks and remove hand-rolled request pending/error state.
- [x] 3.3 Preserve editable generated schema drafts after successful mutations and verify failed retries do not clear user edits.
- [x] 3.4 Update schema workflow tests for pending banners, errors, latest successful output, and editable draft preservation.

## 4. Document And Query Workflow State Improvements

- [x] 4.1 Keep document row-specific processing indicators client-owned while relying on mutation state for backend lifecycle and process errors.
- [x] 4.2 Add document workflow tests proving nullable queries do not call endpoints without required ids and row-specific pending state remains scoped.
- [x] 4.3 Refactor query parameter parsing so invalid JSON blocks validate and execute submissions instead of silently sending `{}`.
- [x] 4.4 Add query workflow tests for invalid parameter JSON gating and generated query response seeding editable Cypher/parameter drafts.

## 5. State Ownership Review

- [x] 5.1 Review feature pages for redundant state that can be derived during render and remove synchronized copies where behavior is unchanged.
- [x] 5.2 Extract feature-local reducer or workflow hooks only where multi-field state transitions become clearer and tests remain readable.
- [x] 5.3 Verify no production feature component directly calls exported API functions for user-triggered backend workflows where a hook exists.

## 6. Validation

- [x] 6.1 Run `npm run lint` and fix any lint violations introduced by the refactor.
- [x] 6.2 Run `npm run test:run` and fix any failing unit/workflow tests.
- [x] 6.3 Run `npm run coverage` and ensure coverage thresholds and reports remain valid.
- [x] 6.4 Run `npm run build` and fix any TypeScript or production build issues.
