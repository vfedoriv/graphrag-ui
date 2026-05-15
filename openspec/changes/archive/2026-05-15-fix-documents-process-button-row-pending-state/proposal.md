## Why

The Documents table currently applies the Process button pending state globally, so clicking Process on one row changes button text/rendering across other rows. This is misleading and makes it unclear which document is being processed.

## What Changes

- Scope Process button pending state to the document row that triggered processing.
- Keep other table rows interactive and visually unchanged while a different row is processing.
- Preserve existing process success/failure feedback behavior and overwrite-confirm flows.
- Add regression tests to verify row-scoped pending rendering.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `document-ingestion-and-processing`: Documents table process action requirement is refined so pending/loading UI is row-specific rather than applied to all rows.

## Impact

- Affected frontend files in the Documents page component state/rendering logic.
- Affected document workflow tests in feature test suite.
- No backend contract changes.
