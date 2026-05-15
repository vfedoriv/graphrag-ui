## 1. API Contract Alignment

- [x] 1.1 Update document processing API request type/function to include `allowOverwrite` boolean input.
- [x] 1.2 Ensure default process calls send `allowOverwrite=false` and keep existing call signatures compatible where possible.

## 2. Documents Workflow Behavior

- [x] 2.1 Add deterministic conflict handling: treat HTTP `409` from process requests with `allowOverwrite=false` as overwrite-not-allowed.
- [x] 2.2 Show confirmation dialog before processing documents marked completed/successfully processed, and send `allowOverwrite=true` only on confirm.
- [x] 2.3 Preserve current inline success/error feedback behavior for both first-attempt and overwrite-confirm retry flows.

## 3. Validation and Regression Coverage

- [x] 3.1 Add/update unit tests for process request construction (`allowOverwrite=false` default and `true` on confirmed retry).
- [x] 3.2 Add/update Documents feature tests covering status-based confirmation dialog flow and accept/decline outcomes.
- [x] 3.3 Run `npm run lint`, `npm run test:run`, and `npm run build` to confirm no regressions.
