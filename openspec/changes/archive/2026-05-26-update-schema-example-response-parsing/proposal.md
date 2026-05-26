## Why

The backend changed both schema example endpoints (`from text` and `from file`) to return the example array payload directly as a string instead of wrapping it in an `example` field. The UI currently expects the old shape, so users can no longer reliably view generated examples.

## What Changes

- Update schema example response parsing to support the new backend payload shape where the response body is the raw JSON array string.
- Keep rendering behavior consistent in schema example result panels after parsing.
- Preserve compatibility handling for legacy wrapped responses (`{ "example": "[...]" }`) during transition to avoid regressions across environments.
- Add or update tests for schema example parsing and UI output handling for both text and file workflows.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `schema-generation-workflow`: Requirements for schema example generation responses change to accept and parse raw string-array payloads (with backward compatibility for wrapped responses).

## Impact

- Affected frontend areas: schema example API response handling, schema example workflow hooks/components, and related tests.
- API contract impact: frontend parser aligns with backend response change for `get schema example` endpoints.
- No infrastructure or deployment changes.
