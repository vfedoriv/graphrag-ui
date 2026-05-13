## Why

The review on 2026-05-13 identified multiple controller workflows where mutation/query failures were not visible to users, causing silent failure behavior and misleading page states. This change standardizes explicit error feedback for high-risk actions so users can reliably detect and recover from failures.

## What Changes

- Add requirement-level guarantees that controller pages show actionable error feedback for failed mutation and query operations.
- Ensure async button handlers using `mutateAsync` do not leak unhandled promise rejections and rely on visible mutation error state.
- Define consistent error-state rendering patterns for queries that currently default to empty/output states during failure.
- Add regression tests covering representative error-path UI behavior across affected controller pages.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `query-authoring-and-execution`: require visible error feedback for ask/generate/validate/execute workflow failures.
- `knowledge-base-management`: require visible error feedback for create/update/delete failures and safe async mutation handling.
- `document-ingestion-and-processing`: require visible error feedback for process and chunk-inspection failures.
- `schema-management-and-activation`: require visible error feedback for activation and YAML validation request failures.
- `test-coverage-and-quality-governance`: require regression tests for newly required error states in controller workflows.

## Impact

- Affected code: feature page UI in `src/features/queries`, `src/features/knowledge-bases`, `src/features/documents`, `src/features/schemas`, and related tests.
- No backend contract changes.
- Improves operational UX and reduces silent-failure risk in core admin workflows.
