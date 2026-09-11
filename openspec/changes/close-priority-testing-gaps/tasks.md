## 1. Document Source and Processing Coverage

- [x] 1.1 Add focused tests for document open-target selection across local paths, supported URIs, missing metadata, malformed URIs, and unsupported protocols; verify the targeted test file passes.
- [x] 1.2 Add tests for local-file open requests covering success, structured error detail, malformed error bodies, 404 fallback guidance, and generic failure guidance; verify fetch requests and visible/error results match the contract.
- [x] 1.3 Add tests for document error formatting across `ApiError` details, field errors, ordinary errors, and unknown failures; verify the focused helper suite passes.
- [x] 1.4 Extend document workflow tests for local opening, browser opening, blocked popups, clipboard copying, and pending/error cleanup; verify user-facing feedback and side effects through React Testing Library.
- [x] 1.5 Extend document processing action tests for declined overwrite, stale-status 409 confirmation and retry, failed retry, save/clear failure retention, replacement, and deletion failure cleanup; verify mutation calls and row-specific pending state.

## 2. Advanced Search Lifecycle Coverage

- [x] 2.1 Add tests for changing or clearing the selected knowledge base while a run is focused; verify the run query parameter, history page, notices, and old workspace cache are reset as intended.
- [ ] 2.2 Add tests for mismatched, missing, and expired focused runs; verify stale run selection is cleared while question/options/history state and actionable feedback are preserved.
- [ ] 2.3 Add tests for maximum-evidence boundaries, invalid values, queue conflicts, ordinary submission failures, cancellation failures, and terminal-state cancellation rules; verify requests, disabled actions, and visible notices.

## 3. Schema Workflow Coverage

- [x] 3.1 Extend candidate-review tests for valid modify and pin decisions, malformed JSON, changed identity or kind, optional rationale, cancel, pending, and read-only states; verify emitted decision payloads and visible validation errors.
- [ ] 3.2 Add selective Schema Builder interaction tests for node and relationship add/remove flows, connection and reconnection validation, and selected-element transitions; verify serialized schema content and inspector state remain synchronized.
- [ ] 3.3 Add Schema Builder tests for schema load, validation, create, and update failure feedback plus guarded actions without a selected knowledge base; verify visible alerts and absence of invalid mutation calls.

## 4. Baseline, Documentation, and Gates

- [ ] 4.1 Run `npm run coverage` after the focused suites pass and update `docs/testing-gap-report.md` with the measurement date, exact metrics, configured gates, threshold headroom, closed items, remaining priorities, rationale, and closure criteria.
- [ ] 4.2 Reassess each Vitest threshold against the new stable baseline, raising only values that retain a documented safety margin; verify `npm run coverage` passes and the report records the decision for raised or retained gates.
- [ ] 4.3 Run `openspec validate --all`, `npm run lint`, `npm run test:run`, `npm run test:e2e`, `npm run coverage`, and `npm run build`; record or resolve every actionable failure before marking the change complete.
