## Why

Recent code review findings (2026-05-13) identified a critical reliability gap in `src/api/client.ts`: network failures and invalid JSON responses can escape as raw runtime errors instead of normalized API errors. This creates inconsistent behavior across feature pages and leaves mutation/query error handling brittle.

## What Changes

- Update `apiFetch` to normalize fetch-level failures (for example offline/CORS/abort) into the shared `ApiError` shape.
- Guard success-path JSON parsing and convert malformed payload failures into normalized `ApiError` values.
- Promote `ApiError` to extend JavaScript `Error` so callers can safely rely on `instanceof Error` and consistent `message` semantics.
- Keep existing success and `ProblemDetail` handling behavior intact while hardening failure boundaries.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `api-client-and-error-normalization`: strengthen requirements so all client failure modes (transport, non-2xx responses, and malformed JSON payloads) are normalized to `ApiError` behavior expected by UI consumers.

## Impact

- Affected code: `src/api/client.ts`, `src/api/types.ts`, and API-client unit tests.
- Affected behavior: feature-level mutation/query error surfaces become more deterministic because all major client failures produce consistent errors.
- No backend API contract changes.
