## 1. Dependencies and Backend Contract Readiness

- [ ] 1.1 Complete and validate `add-schema-draft-workbench` before extending its selected-draft route
- [ ] 1.2 Confirm and document authoritative current/list operations for evaluation runs and reprocessing plans needed for reload recovery and history
- [ ] 1.3 Confirm stable aggregate, per-document metric, and advisory-assessment JSON contracts with representative completed, partial, failed, stale, and reused fixtures
- [ ] 1.4 Confirm whether backend-provided evaluation eligibility is available or approve conservative exclusion of every active document source

## 2. Release API and State Foundation

- [ ] 2.1 Add typed evaluation start/status/outcome/retry contracts and runtime guards for structured metric and advisory payloads
- [ ] 2.2 Add publication-readiness, blocking-reason, publish, and publication-audit contracts
- [ ] 2.3 Add reprocessing-plan start/status/item/retry contracts reusing the established document processing option shape
- [ ] 2.4 Add evaluation, readiness, publication, and reprocessing API functions with paging and multipart-independent JSON bodies
- [ ] 2.5 Add nullable-safe query keys and polling hooks scoped by knowledge base, draft, run or plan ID, page, and size
- [ ] 2.6 Add targeted invalidation for evaluation completion, review changes, publication, activation, and reprocessing completion
- [ ] 2.7 Add API and hook tests for 202 responses, status locations, polling terminal states, exact revision/hash publish bodies, retry flags, and normalized conflicts

## 3. Held-Out Evaluation UI

- [ ] 3.1 Build held-out document selection from the current knowledge base with conservative active-document-source exclusion and retained selections on backend rejection
- [ ] 3.2 Add the advisory-assessment control and evaluation start confirmation using the current draft revision
- [ ] 3.3 Build evaluation polling, aggregate progress, paged document outcomes, and terminal partial/failed/interrupted states
- [ ] 3.4 Build typed deterministic metric presentation with formulas, denominators, not-applicable states, and evidence coordinates
- [ ] 3.5 Build separately labeled advisory question-coverage and schema-noise presentation with reproducibility context
- [ ] 3.6 Add the clearly labeled structured fallback inspector when the metric/advisory contract remains generic
- [ ] 3.7 Add evaluation retry with reused-outcome presentation and authoritative reload recovery/history

## 4. Readiness and Publication UI

- [ ] 4.1 Build publication-readiness loading with exact revision, aggregate, target identity, projection hash, and complete blocking-reason presentation
- [ ] 4.2 Invalidate readiness after every source, guidance, analysis, decision, conflict, or evaluation change that can make its token stale
- [ ] 4.3 Add guarded publication confirmation that states it creates an inactive schema and submits only the exact ready revision/hash
- [ ] 4.4 Handle stale publication tokens by reloading review/readiness state without automatic retry and handle idempotent existing publication as success
- [ ] 4.5 Build the read-only publication audit view with schema link, published/current hashes, active state, timestamp, and prominent drift feedback

## 5. Explicit Activation Stage

- [ ] 5.1 Add activation of the published schema through the existing schema mutation hook with a separate confirmation
- [ ] 5.2 Refresh knowledge-base, schema-list, draft, publication, readiness, and release-stage state after activation
- [ ] 5.3 Render inactive, active, failed, and drifted states without implying that publication activated or reprocessed anything
- [ ] 5.4 Add navigation from publication context to the normal schema details and Schema Builder flows with drift guidance

## 6. Reprocessing Plan UI

- [ ] 6.1 Gate plan creation on the published schema being active for the selected knowledge base
- [ ] 6.2 Build mutually exclusive all-document and explicit-document scopes with owned document selection
- [ ] 6.3 Reuse the document processing option editor/normalization for optional plan processing options
- [ ] 6.4 Add confirmed plan creation with draft/schema identity and explicit scope payload
- [ ] 6.5 Build active plan polling with aggregate counts and paged item status for succeeded, failed, stale, blocked, interrupted, and skipped outcomes
- [ ] 6.6 Add safety-specific explanations for active-schema blocking and changed-document staleness
- [ ] 6.7 Add retry with an explicit resnapshot choice, retry lineage, and separation of prior successes from unresolved work
- [ ] 6.8 Restore active/recent plans from authoritative backend discovery after navigation or reload

## 7. Workflow Verification

- [ ] 7.1 Add component and workflow tests for eligibility, deterministic/advisory separation, polling, retry, readiness invalidation, stale publication, drift, activation, and plan safety states
- [ ] 7.2 Add cache-invalidation tests proving publication, activation, and reprocessing stay separate and refresh their consumers correctly
- [ ] 7.3 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`
- [ ] 7.4 Run browser end-to-end coverage against the matching backend for evaluate, publish, activate, plan, partial outcome, retry, reload recovery, and content-drift flows
