## 1. Chunking Workspace Shell

- [x] 1.1 Add a lazy `/chunking` route and shared workspace page that normalizes missing/invalid `view` parameters to Strategy
- [x] 1.2 Add Chunking to primary navigation immediately after Documents and before Queries, preserving selected knowledge-base context
- [x] 1.3 Build responsive Strategy/Chunk Explorer/Reprocessing workspace navigation with unavailable dependent views explained until implemented
- [x] 1.4 Add route and navigation tests for direct URL rendering, active styling, and no-knowledge-base Strategy access

## 2. Authoritative Strategy Read Model

- [x] 2.1 Load runtime settings and aggregate chunking state independently with source-specific pending/error states
- [x] 2.2 Define the fixed canonical control map and join each key to runtime-setting mutation metadata and aggregate effective state
- [x] 2.3 Render effective values and sources plus settings hash, component revisions, tokenizer/count mode, parser/representation metadata, effective revision, and migration lifecycle
- [x] 2.4 Render compatibility aliases only in a conditional collapsed explanation with configured/effective values and precedence
- [x] 2.5 Keep unavailable or immutable canonical controls read-only and direct non-curated chunk settings to generic Settings

## 3. Atomic Editing

- [x] 3.1 Implement type-aware local drafts and validation using backend enum/numeric constraints without mutating on field change
- [x] 3.2 Submit only changed canonical settings in one bulk runtime-settings request with pending and normalized error feedback
- [x] 3.3 On success, refetch both runtime settings and chunking state and clear drafts only after accepted state is reflected
- [x] 3.4 After an effective strategy change, explain that existing documents are unchanged and expose an explicit Reprocessing-view handoff without automatic preview or creation

## 4. Strategy Verification

- [x] 4.1 Add component tests for canonical order, scope labels, values/sources, lifecycle/revisions, constraints, immutable keys, and alias visibility
- [x] 4.2 Add mutation tests for staged edits, changed-only atomic payloads, rejected-draft retention, dual invalidation, and no automatic migration request
- [x] 4.3 Add responsive/direct-route workflow coverage and update shell navigation regression tests
- [x] 4.4 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`
