## Why

The fourth action from the 2026-05-13 review flags critical missing tests around file selection behavior, API client edge branches, and core mutation workflows. These gaps leave high-risk behavior unguarded and increase regression risk in day-to-day admin operations.

## What Changes

- Add targeted tests for `FileSelectButton` including input reset (`event.target.value = ''`) and async `onFileSelected` behavior.
- Add API client tests for 204 and empty-body success paths used by delete/activate flows.
- Add API client normalization tests for `normalizeProblemDetail` fallback branches (title-only and null payload).
- Add/extend workflow tests for knowledge-base delete + auto-deselect behavior.
- Add/extend workflow tests for schema activation from table row actions.
- Keep test scope focused on critical and important review-priority coverage items.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `button-triggered-file-selection`: require coverage of input reset and async selection handling behavior.
- `api-client-and-error-normalization`: require coverage of 204/empty-body handling and ProblemDetail fallback normalization branches.
- `knowledge-base-management`: require workflow coverage for delete + selected KB state reconciliation.
- `schema-management-and-activation`: require workflow coverage for row-level schema activation flow.
- `test-coverage-and-quality-governance`: require these high-priority gaps to be represented in enforced regression coverage.

## Impact

- Affected code: tests in `src/shared/ui`, `src/api`, and feature workflow tests for KBs/schemas.
- No runtime behavior or backend contract changes expected.
- Improves confidence in fragile branches and high-impact workflows.
