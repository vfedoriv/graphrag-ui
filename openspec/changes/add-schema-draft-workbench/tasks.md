## 1. Backend Contract Readiness

- [ ] 1.1 Confirm and document how an owned draft returns its complete current guidance value; keep loaded-guidance editing gated until the contract exists
- [ ] 1.2 Confirm and document the authoritative current/list-analysis-runs contract needed to recover polling after reload
- [ ] 1.3 Confirm the persistent candidates endpoint is a paged discovery `Candidate` contract and capture representative success, partial, conflict, and error fixtures

## 2. Draft API and State Foundation

- [ ] 2.1 Add feature-local lifecycle, guidance, source, analysis, candidate, evidence, decision, conflict, projection, diff, and paged-response TypeScript contracts
- [ ] 2.2 Add runtime validation for the backend candidate page and other generic structured payload boundaries
- [ ] 2.3 Add schema-draft lifecycle and guidance API functions plus multipart file-source handling
- [ ] 2.4 Add source, analysis start/status/retry, candidate, decision, conflict, projection, and diff API functions
- [ ] 2.5 Add knowledge-base/draft-scoped nullable-safe query key factories for every list, detail, page, and run resource
- [ ] 2.6 Add TanStack Query hooks with targeted cache updates and invalidation after revision-bearing mutations
- [ ] 2.7 Add API and hook tests for JSON bodies, multipart requests, revision query parameters, paging, polling terminal states, and normalized 409 errors

## 3. Route and Draft Lifecycle UI

- [ ] 3.1 Add lazy `/schema-drafts` and `/schema-drafts/:draftId` routes and the Schema Drafts primary-navigation entry
- [ ] 3.2 Build the no-knowledge-base state and knowledge-base-scoped draft list with human-readable lifecycle, revision, base, and publication metadata
- [ ] 3.3 Build draft creation with target identity, owned base-schema selection, and complete structured guidance fields
- [ ] 3.4 Build selected-draft overview and open-draft target update behavior using the current cached revision
- [ ] 3.5 Build safe loaded-guidance round-trip editing, or its explicit read-only gated state when the prerequisite contract is unavailable
- [ ] 3.6 Add confirmed open-draft deletion and clear incompatible detail state after deletion or global knowledge-base changes
- [ ] 3.7 Add stale-revision conflict feedback that refetches authority while preserving unsent form values and selections
- [ ] 3.8 Render published drafts as read-only audit resources and disable all planning mutations

## 4. Multi-Source Management

- [ ] 4.1 Build existing-document source selection from the current knowledge base and serialize multi-document additions across advancing revisions
- [ ] 4.2 Build named pasted-text source creation while keeping submitted text out of metadata-only source views
- [ ] 4.3 Build draft-owned file selection and multipart upload without affecting the normal document list
- [ ] 4.4 Build the source table with type, status, revision, fingerprint, analyzed state, size, document context, and timestamps
- [ ] 4.5 Add state-aware refresh, confirmed removal, and restore controls with source/detail invalidation
- [ ] 4.6 Preserve per-item outcomes and unresolved selections when a serialized multi-source operation partially fails

## 5. Durable Analysis Workflow

- [ ] 5.1 Add analysis start controls and immediate server-owned pending feedback using the current draft revision
- [ ] 5.2 Add bounded polling for active analysis and stop/invalidate behavior for completed, partial, and failed runs
- [ ] 5.3 Build aggregate progress and paged per-source outcome views with reused, retryable, and privacy-safe failure states
- [ ] 5.4 Add retry for eligible terminal runs and show reused successful outcomes separately
- [ ] 5.5 Restore active/recent analysis from the authoritative backend discovery contract after navigation or reload

## 6. Candidate and Conflict Review

- [ ] 6.1 Build the paged candidate table with scalable evidence disclosure, origin badges, support, confidence, coordinates, and review state
- [ ] 6.2 Add accept and reject decisions with optional rationale and append-only decision-history feedback
- [ ] 6.3 Add modify and pin editors that preserve candidate identity/kind and retain edits across request failures
- [ ] 6.4 Build conflict views and mutually exclusive alternative/custom resolution controls with revision-aware submission
- [ ] 6.5 Invalidate and refresh affected draft, candidate, decision, conflict, projection, and diff data after successful review mutations

## 7. Projection, Diff, and Quality Verification

- [ ] 7.1 Build readable and structured effective-projection views with aggregate and draft revision context and no direct replacement editing
- [ ] 7.2 Build filterable compatibility diffs with clear additive, review-required, and breaking before/after presentation
- [ ] 7.3 Add component and workflow tests for no-workspace, lifecycle, serialized sources, polling, retry, stale revisions, candidate decisions, conflicts, projection, and diff behavior
- [ ] 7.4 Add navigation/deep-link tests and verify the Schema Drafts route remains split from the initial application bundle
- [ ] 7.5 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`
- [ ] 7.6 Run browser end-to-end coverage against the matching backend for create, add sources, analyze, review, reanalyze, inspect diff, and delete flows
