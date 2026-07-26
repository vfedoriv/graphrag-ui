## 1. Analysis Contract Alignment

- [x] 1.1 Extend schema-draft analysis TypeScript types with nullable source failure codes, nullable effective execution budgets, and `canRetry` on detail and history summaries.
- [x] 1.2 Extend the strict Zod validators for analysis detail, history summaries, and nested source outcomes while preserving null legacy metadata.
- [x] 1.3 Update analysis fixtures to represent current expanded responses and add legacy fixtures with null failure-code and execution-budget fields.
- [x] 1.4 Add API parser tests that accept current and legacy analysis responses and continue rejecting unrelated contract drift.

## 2. Retry and Active-Run Behavior

- [x] 2.1 Gate the selected-run Retry action with `canRetry` while retaining `retryable` as diagnostic failure classification.
- [x] 2.2 Derive general Start analysis availability independently from the selected historical run so an authoritative active run keeps Start disabled.
- [x] 2.3 Refresh draft detail, analysis history, and selected-run state after retry success or an eligibility-related mutation rejection without hiding the normalized backend error.
- [x] 2.4 Add workbench tests for all meaningful `retryable` and `canRetry` combinations and for selecting history while another analysis remains active.

## 3. Analysis Diagnostics

- [x] 3.1 Add reusable presentation helpers for captured concurrency, human-readable timeout durations, stable failure-code labels, and legacy-unavailable values.
- [x] 3.2 Show the selected run's captured source concurrency, source timeout, and request timeout without substituting current settings for missing legacy values.
- [x] 3.3 Show broad failure category, detailed failure code, and persisted source retryability together in source-outcome rows with a safe fallback for unknown future codes.
- [x] 3.4 Add component tests for current budgets, legacy null budgets, deadline failures, legacy null failure codes, and unknown future failure codes.

## 4. Validation

- [x] 4.1 Run focused schema-draft API and workbench tests and resolve any regressions.
- [x] 4.2 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
