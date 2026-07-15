## 1. Dependencies and Backend Contract Fixtures

- [x] 1.1 Complete and validate `add-schema-draft-workbench` before extending its selected-draft route
- [x] 1.2 Capture draft workflow references, paged evaluation-run history, and draft-filtered paged reprocessing-plan history with current/latest/target-current, retryability, lineage, and status locations
- [x] 1.3 Capture typed aggregate and per-document metrics plus advisory execution, question coverage, schema-noise, reason, warning, evidence, and reproducibility fixtures for completed, partial, failed, stale, and reused cases
- [x] 1.4 Capture evaluation-eligible-document pages with eligible/ineligible rows, `ACTIVE_DISCOVERY_EVIDENCE`, draft revision, current aggregate ID, paging, and ownership-safe errors

## 2. Release API and State Foundation

- [x] 2.1 Add typed evaluation eligibility, start/status/history/outcome/retry, metric, applicability, advisory-status, reason, evidence, and reproducibility contracts
- [x] 2.2 Add publication-readiness, blocking-reason, publish, and publication-audit contracts
- [x] 2.3 Add reprocessing-plan start/status/history/item/retry contracts reusing the standard page envelope and established document processing option shape
- [x] 2.4 Add evaluation eligibility/status/history/retry, readiness, publication, and reprocessing status/history/retry API functions with standard paging and JSON bodies
- [x] 2.5 Add nullable-safe query keys and polling hooks scoped by knowledge base, draft, run or plan ID, page, and size
- [x] 2.6 Add targeted invalidation for evaluation completion, review changes, publication, activation, and reprocessing completion
- [x] 2.7 Add API and hook tests for 202 responses, status locations, nested outcome/item pages, absence of removed parallel count fields, polling terminal states, v1 evaluation adaptation, exact revision/hash publish bodies, retry flags, and normalized conflicts

## 3. Held-Out Evaluation UI

- [x] 3.1 Build paged held-out selection from the backend eligibility endpoint, disable ineligible rows with reasons, and reject stale draft/aggregate eligibility snapshots
- [x] 3.2 Add the advisory-assessment control and evaluation start confirmation using the current draft revision
- [x] 3.3 Build evaluation polling, aggregate progress, paged document outcomes, and terminal partial/failed/interrupted states
- [x] 3.4 Build typed deterministic metric presentation with formulas, denominators, not-applicable states, and evidence coordinates
- [x] 3.5 Build separately labeled completed advisory question-coverage and schema-noise assessments with reasons, coordinates, and reproducibility context
- [x] 3.6 Render not-requested, model-free-completion, and failed advisory execution states with reasons and warnings while keeping deterministic results independent
- [x] 3.7 Add evaluation retry with reused-outcome presentation, draft-reference recovery, and paged authoritative history

## 4. Readiness and Publication UI

- [x] 4.1 Build publication-readiness loading with exact revision, aggregate, target identity, projection hash, and complete blocking-reason presentation
- [x] 4.2 Invalidate readiness after every source, guidance, analysis, decision, conflict, or evaluation change that can make its token stale
- [x] 4.3 Add guarded publication confirmation that states it creates an inactive schema and submits only the exact ready revision/hash
- [x] 4.4 Handle stale publication tokens by reloading review/readiness state without automatic retry and handle idempotent existing publication as success
- [x] 4.5 Build the read-only publication audit view with schema link, published/current hashes, active state, timestamp, and prominent drift feedback

## 5. Explicit Activation Stage

- [x] 5.1 Add activation of the published schema through the existing schema mutation hook with a separate confirmation
- [x] 5.2 Refresh knowledge-base, schema-list, draft, publication, readiness, and release-stage state after activation
- [x] 5.3 Render inactive, active, failed, and drifted states without implying that publication activated or reprocessed anything
- [x] 5.4 Add navigation from publication context to the normal schema details and Schema Builder flows with drift guidance

## 6. Reprocessing Plan UI

- [x] 6.1 Gate plan creation on the published schema being active for the selected knowledge base
- [x] 6.2 Build mutually exclusive all-document and explicit-document scopes with owned document selection
- [x] 6.3 Reuse the document processing option editor/normalization for optional plan processing options
- [x] 6.4 Add confirmed plan creation with draft/schema identity and explicit scope payload
- [x] 6.5 Build active plan polling with aggregate counts and paged item status for succeeded, failed, stale, blocked, interrupted, and skipped outcomes
- [x] 6.6 Add safety-specific explanations for active-schema blocking and changed-document staleness
- [x] 6.7 Add retry with an explicit resnapshot choice, retry lineage, and separation of prior successes from unresolved work
- [x] 6.8 Restore the latest plan from the draft reference and expose draft-filtered paged history with latest, target-current, retryable, and retry-lineage states

## 7. Workflow Verification

- [x] 7.1 Add component and workflow tests for eligibility, deterministic/advisory separation, polling, retry, readiness invalidation, stale publication, drift, activation, and plan safety states
- [x] 7.2 Add cache-invalidation tests proving publication, activation, and reprocessing stay separate and refresh their consumers correctly
- [x] 7.3 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`
- [x] 7.4 Run browser end-to-end coverage against the matching backend for evaluate, publish, activate, plan, partial outcome, retry, reload recovery, and content-drift flows
