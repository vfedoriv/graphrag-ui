## 1. Contract Types

- [ ] 1.1 Extend `RuntimeSetting` with active/effective lifecycle fields while preserving current settings-page compatibility
- [ ] 1.2 Add authoritative chunking-state, compatibility-alias, component-revision, bounded chunk page/summary/hierarchy, and complete nullable chunk-provenance DTOs
- [ ] 1.3 Add generalized reprocessing reason, selection, filter, preview target/blocker/classification, plan summary/detail/item, and closed retry-mode DTOs
- [ ] 1.4 Add advanced-search readiness, create, summary/detail/page, cancellation, result-envelope, answer/claim/evidence/context/graph-fact, limitation, and diagnostic DTOs
- [ ] 1.5 Add runtime guards that distinguish valid version-one results, unsupported versions, and malformed payloads while retaining raw JSON

## 2. API Modules and Query Keys

- [ ] 2.1 Add chunking-state API functions/hooks and stable root/detail query keys
- [ ] 2.2 Replace new-workspace chunk access with hierarchy, filtered page, and direct-lookup functions/hooks whose keys include all paging/filter inputs
- [ ] 2.3 Add migration-preview and generalized reprocessing functions/hooks for filtered history, paged detail, creation, and `RESNAPSHOT_UNRESOLVED` retry
- [ ] 2.4 Add advanced-search readiness, submit, filtered history, detail, result, and cancellation functions/hooks with exact route and payload serialization
- [ ] 2.5 Implement shared terminal-status helpers, focused-run 1.5-second polling options, plan polling options, and completed/partial-only result enablement
- [ ] 2.6 Preserve structured readiness/migration admission details during `ProblemDetail` normalization

## 3. Shared Reprocessing Extraction

- [ ] 3.1 Move reprocessing-plan types, raw API functions, hooks, and query keys from schema drafts into a shared API/domain module
- [ ] 3.2 Migrate schema-draft consumers to shared reprocessing resources without changing schema-activation request semantics
- [ ] 3.3 Update strict schema-draft response parsing for generalized plan fields, `BLOCKED_TARGET_CHANGED`, filtered pages, and closed retry requests
- [ ] 3.4 Update schema-draft fixtures and workflow assertions while retaining publication, history, polling, item paging, and retry coverage

## 4. Contract Verification

- [ ] 4.1 Add exact route/query/payload tests for chunking state, hierarchy/page/direct chunk reads, migration preview/history/create/retry, and advanced-search readiness/runs/results/cancellation
- [ ] 4.2 Add query-key tests proving knowledge-base, document, resource ID, paging, and filter isolation plus disabled sentinel behavior
- [ ] 4.3 Add advanced-search serialization tests for `maximumEvidence`, omitted blank maximum, default evidence text, and machine-readable readiness conflicts
- [ ] 4.4 Add typed result tests for valid version one, nullable legacy source metadata, mismatched/unsupported versions, malformed structures, and retained raw diagnostics
- [ ] 4.5 Add regression tests proving schema reprocessing emits `mode: RESNAPSHOT_UNRESOLVED` and never emits the deprecated boolean
- [ ] 4.6 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`
