## 1. Backend Contract Fixtures

- [x] 1.1 Capture canonical `DraftGuidance` fixtures from draft create, list, detail, metadata update, and guidance update responses, including validation errors
- [x] 1.2 Capture `currentAnalysis` workflow references and paged analysis-run summary/detail fixtures covering current, stale, running, partial, failed, retry, and lineage states
- [x] 1.3 Capture typed candidate pages with recommendation state, effective persistent review state, latest decision ID, evidence, and paging metadata

## 2. Draft API and State Foundation

- [x] 2.1 Add feature-local lifecycle, typed guidance, workflow-reference, source, analysis history/detail, candidate, evidence, decision, conflict, projection, diff, and standard page-envelope TypeScript contracts
- [x] 2.2 Add boundary validation for typed responses and genuinely open structured projection, decision, conflict, and diff payloads
- [x] 2.3 Add schema-draft lifecycle and guidance API functions plus multipart file-source handling
- [x] 2.4 Add source, analysis start/status/history/retry, candidate, decision, conflict, projection, and diff API functions
- [x] 2.5 Add knowledge-base/draft-scoped nullable-safe query key factories for every list, detail, page, and run resource
- [x] 2.6 Add TanStack Query hooks with targeted cache updates and invalidation after revision-bearing mutations
- [x] 2.7 Add API and hook tests for JSON bodies, multipart requests, revision query parameters, standard/nested page envelopes, absence of removed parallel count fields, polling terminal states, and normalized 409 errors

## 3. Route and Draft Lifecycle UI

- [x] 3.1 Add lazy `/schema-drafts` and `/schema-drafts/:draftId` routes and the Schema Drafts primary-navigation entry
- [x] 3.2 Build the no-knowledge-base state and knowledge-base-scoped draft list with human-readable lifecycle, revision, base, and publication metadata
- [x] 3.3 Build draft creation with target identity, owned base-schema selection, and complete structured guidance fields
- [x] 3.4 Build selected-draft overview and open-draft target update behavior using the current cached revision
- [x] 3.5 Build safe canonical loaded-guidance round-trip editing with field validation and retained input on rejection
- [x] 3.6 Add confirmed open-draft deletion and clear incompatible detail state after deletion or global knowledge-base changes
- [x] 3.7 Add stale-revision conflict feedback that refetches authority while preserving unsent form values and selections
- [x] 3.8 Render published drafts as read-only audit resources and disable all planning mutations

## 4. Multi-Source Management

- [x] 4.1 Build existing-document source selection from the current knowledge base and serialize multi-document additions across advancing revisions
- [x] 4.2 Build named pasted-text source creation while keeping submitted text out of metadata-only source views
- [x] 4.3 Build draft-owned file selection and multipart upload without affecting the normal document list
- [x] 4.4 Build the source table with type, status, revision, fingerprint, analyzed state, size, document context, and timestamps
- [x] 4.5 Add state-aware refresh, confirmed removal, and restore controls with source/detail invalidation
- [x] 4.6 Preserve per-item outcomes and unresolved selections when a serialized multi-source operation partially fails

## 5. Durable Analysis Workflow

- [x] 5.1 Add analysis start controls and immediate server-owned pending feedback using the current draft revision
- [x] 5.2 Add bounded polling for active analysis and stop/invalidate behavior for completed, partial, and failed runs
- [x] 5.3 Build aggregate progress and paged per-source outcome views with reused, retryable, and privacy-safe failure states
- [x] 5.4 Add retry for eligible terminal runs and show reused successful outcomes separately
- [x] 5.5 Restore active analysis from `currentAnalysis`, resume polling through its status location, and expose paged recent history with currentness, retryability, and retry lineage

## 6. Candidate and Conflict Review

- [x] 6.1 Build the paged candidate table with scalable evidence disclosure, origin badges, support, confidence, coordinates, and review state
- [x] 6.2 Add accept and reject decisions with optional rationale and append-only decision-history feedback
- [x] 6.3 Add modify and pin editors that preserve candidate identity/kind and retain edits across request failures
- [x] 6.4 Build conflict views and mutually exclusive alternative/custom resolution controls with revision-aware submission
- [x] 6.5 Invalidate and refresh affected draft, candidate, decision, conflict, projection, and diff data after successful review mutations

## 7. Projection, Diff, and Quality Verification

- [x] 7.1 Build readable and structured effective-projection views with aggregate and draft revision context and no direct replacement editing
- [x] 7.2 Build filterable compatibility diffs with clear additive, review-required, and breaking before/after presentation
- [x] 7.3 Add component and workflow tests for no-workspace, lifecycle, serialized sources, polling, retry, stale revisions, candidate decisions, conflicts, projection, and diff behavior
- [x] 7.4 Add navigation/deep-link tests and verify the Schema Drafts route remains split from the initial application bundle
- [x] 7.5 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`
- [x] 7.6 Run browser end-to-end coverage against the matching backend for create, add sources, analyze, review, reanalyze, inspect diff, and delete flows
