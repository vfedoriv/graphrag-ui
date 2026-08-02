## 1. Workspace and Readiness

- [x] 1.1 Add lazy `/advanced-search` routing and place Advanced Search after Chunking and before Queries in navigation
- [x] 1.2 Build the workspace layout with primary question/submit controls, compact readiness, focused run, and paged history regions
- [x] 1.3 Load readiness for the selected knowledge base and separate blockers from informational `SCHEMA_UNAVAILABLE` and `EMPTY_CORPUS`
- [x] 1.4 Invalidate/refetch readiness after knowledge-base, active-schema, AI-profile assignment, and relevant document-processing changes
- [x] 1.5 Add explicit no-knowledge-base, readiness pending/error, ready, blocked, text-only, and empty-corpus states

## 2. Submission and Options

- [x] 2.1 Implement client-owned question, blank maximum-evidence, and default-enabled evidence-text drafts
- [x] 2.2 Add collapsed advanced options with integer bounds and optional runtime-setting default/max hints
- [x] 2.3 Serialize blank maximum by omission and explicit values as `maximumEvidence`, always using `includeEvidenceText`
- [x] 2.4 Submit a new durable run without cancelling existing runs, focus the accepted run, update history, and preserve the next question draft policy
- [x] 2.5 Handle `429` and readiness `409` without losing question/options/history and refetch readiness around admission conflicts

## 3. Focused Run Lifecycle

- [x] 3.1 Synchronize focused `runId` with URL state and load retained full detail after reload
- [x] 3.2 Render query, applied evidence options, status/stage, branch progress, evidence count, deadlines/timestamps, cancellation, and failure category
- [x] 3.3 Poll only the focused non-terminal run every 1.5 seconds and refresh history when it becomes terminal
- [x] 3.4 Implement idempotent cancellation with pending state and canonical handling of completion/cancellation races
- [x] 3.5 Enable result handoff only for `COMPLETED` or `PARTIAL` and retain lifecycle presentations for failed/cancelled/interrupted runs
- [x] 3.6 Handle pre-result `409` and terminal/expired errors without clearing draft or history

## 4. History and Ownership Reconciliation

- [x] 4.1 Add newest-first server-paged history with status filter, server totals, and query-preview/options/stage/timestamp rows
- [x] 4.2 Select history rows into focused detail and retain full query where the backend still owns it
- [x] 4.3 Clear run ID, readiness, and scoped caches on knowledge-base change with an explanatory notice
- [x] 4.4 Clear expired/not-owned deep links on ownership-safe `404` without searching or switching knowledge bases

## 5. Run Management Verification

- [x] 5.1 Add readiness tests for ready, blocked, text-only, empty-corpus, invalidation, and readiness-conflict refetch
- [x] 5.2 Add request tests for default evidence text, omitted blank maximum, explicit maximum, queue-full preservation, and concurrent submissions
- [x] 5.3 Add lifecycle tests for 1.5-second polling, terminal stop, cancellation, races, interrupted state, and result enablement
- [x] 5.4 Add history/deep-link tests for previews, options, paging, filtering, reload, expired/not-owned runs, and knowledge-base changes
- [x] 5.5 Add deterministic Playwright readiness/submission/history/cancellation flow with mocked `/api/v1` responses
- [x] 5.6 Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, and `npm run test:e2e`
