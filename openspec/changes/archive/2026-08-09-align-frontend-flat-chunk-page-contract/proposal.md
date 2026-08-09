## Why

The backend commit `2c4527b` makes `kind=FLAT` a supported virtual read filter for bounded document chunk pages. The frontend Chunk Explorer already sends that selector and has the required independent hierarchy/flat behavior, but the shared API boundary still models page filters as arbitrary strings, leaving the contract vulnerable to accidental invalid selectors and insufficient cache/type coverage.

## What Changes

- Introduce a request-only chunk-page kind union containing `PARENT`, `CHILD`, and virtual `FLAT`.
- Replace arbitrary string page-filter types in the document API, query hooks, and query-key factories with the typed filter contract.
- Preserve exact uppercase query serialization, including `kind=FLAT`, and retain `FLAT` as a distinct cache identity from `CHILD`.
- Keep response chunk `kind` nullable/string-compatible for legacy data; virtual flat responses remain persisted `CHILD` records selected by missing `parentChunkId`.
- Add regression coverage for exact flat serialization, filter/key isolation, fixture-driven mixed-population compatibility, independent flat-branch failures, and direct flat selection.
- Update the frontend specifications to describe the virtual flat population and the accepted page-filter values.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scalable-chunk-inspection`: Require the bounded flat population to be requested with `kind=FLAT` and preserve existing mixed-branch and error behavior.
- `advanced-operations-api-contracts`: Type bounded chunk-page filters, exact serialization, cache identity, and response-kind nullability.

## Impact

This affects the shared chunk DTO/filter types, `src/api/documents.ts`, `src/api/queryKeys.ts`, chunk API/component tests, and the two capability delta specs. It does not change backend routes, persisted chunk kinds, the compatibility complete-list endpoint, or the existing Chunk Explorer layout and navigation model. The frontend rollout depends on the backend contract from `2c4527b` being deployed first.
