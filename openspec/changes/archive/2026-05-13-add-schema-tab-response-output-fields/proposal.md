## Why

The Schemas page currently lets users call several generation and retrieval endpoints but does not reliably expose backend responses in the UI for key tabs. This blocks users from validating generated YAML or retrieved schema content and makes the workflows incomplete.

## What Changes

- Add visible output text areas for backend responses in these Schemas tabs:
- `Generate schema YAML`
- `Generate schema YAML from file`
- `Get schema by ID`
- Ensure each output area is populated from the corresponding successful backend response payload.
- Ensure each output area is reset or replaced on subsequent requests so users always see the latest result.
- Preserve existing error handling and show errors without masking successful output behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `schema-generation-workflow`: expand requirements so schema generation/retrieval tabs must render response content in dedicated output fields tied to each endpoint action.

## Impact

- Affected frontend feature: Schemas page tab workflows under `src/features/schemas`.
- No backend API contract changes; this is a UI behavior/completeness fix.
- Tests should be updated or added for response rendering behavior in affected tabs.
