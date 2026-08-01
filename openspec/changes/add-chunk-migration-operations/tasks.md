## 1. Reprocessing View and Scope Drafts

- [ ] 1.1 Add the Reprocessing view to Chunking and parse/normalize reload-safe `planId` search parameters
- [ ] 1.2 Build a scope draft with primary `OUTDATED_STRATEGY` and advanced `DOCUMENT_IDS`/`ALL` controls
- [ ] 1.3 Reuse document processing-option definitions for migration overrides and validate owned selected-document IDs
- [ ] 1.4 Clear plan, preview, document selection, and scoped caches on knowledge-base change with an explanatory notice

## 2. Preview-First Admission

- [ ] 2.1 Request preview for the current scope/options/page and invalidate it whenever creation-relevant draft inputs change
- [ ] 2.2 Render readiness, backend blockers, target schema/profile/embedding identity, expected revision, classification totals, and selected count
- [ ] 2.3 Add server-paged selected-document classifications with explicit no-selection and preview error states
- [ ] 2.4 Disable creation unless the matching preview is current, ready, and contains a valid target revision
- [ ] 2.5 Ensure preview never updates history or presents plan/work side effects

## 3. Safe Migration Creation

- [ ] 3.1 Construct migration create payloads with reason, previewed selection/options/expected revision, and document IDs only for selected scope
- [ ] 3.2 Add an accessible in-app forced-all confirmation dialog containing scope counts, target identity/revision, and current-document rebuild warning
- [ ] 3.3 Invalidate an open confirmation if the preview or draft identity changes and require reconfirmation
- [ ] 3.4 Handle create `409` by preserving drafts, invalidating/refetching preview and history, explaining changed admission, and never auto-retrying
- [ ] 3.5 Select the accepted plan and synchronize its `planId` into the URL

## 4. History, Progress, and Retry

- [ ] 4.1 Add newest-first history fixed to `reason=CHUNK_STRATEGY_MIGRATION` with optional selection/status filters and server totals
- [ ] 4.2 Render reason, selection, target revision, status, aggregate progress, target currency, retryability, lineage, and timestamps
- [ ] 4.3 Load/poll the selected active plan, page its nested items, stop at terminal state, and resume after reload
- [ ] 4.4 Add distinct explanations for `STALE_SOURCE`, `BLOCKED`, and `BLOCKED_TARGET_CHANGED`
- [ ] 4.5 Add an accessible retry confirmation dialog and send only `{ mode: 'RESNAPSHOT_UNRESOLVED' }` for eligible terminal plans
- [ ] 4.6 Select the new retry plan, show its lineage, and preserve prior successful-item audit context
- [ ] 4.7 Clear ownership-safe invalid plan deep links without changing the selected knowledge base

## 5. Migration Verification

- [ ] 5.1 Add preview tests for all scopes, processing options, blockers, targets, counts, selected-document paging, and input invalidation
- [ ] 5.2 Add creation tests for payload shapes, forced-all dialog behavior, cancelled confirmation, stale-preview `409`, refetch, and reconfirmation
- [ ] 5.3 Add filtered-history, totals, deep-link, polling, item-paging, status-explanation, and closed-mode retry tests
- [ ] 5.4 Add schema-draft regression tests for shared plan behavior and both reprocessing reasons
- [ ] 5.5 Add deterministic Playwright migration flow with mocked `/api/v1` preview, create, history, detail, and retry responses
- [ ] 5.6 Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, and `npm run test:e2e`
