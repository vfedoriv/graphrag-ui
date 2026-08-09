## Context

The bounded chunk API in `src/api/documents.ts` currently accepts an inline filter with `kind?: string | null`. The corresponding query-key factories also accept arbitrary strings. The Chunk Explorer already requests `{ kind: 'FLAT' }`, keeps the flat branch separate from hierarchy and child branches, preserves selected direct details during page failures, and renders returned records using their response `kind` plus parent absence. The backend now accepts `FLAT` as a virtual selector whose predicate is persisted `CHILD` with `parentChunkId IS NULL`.

The frontend change is therefore a contract-hardening follow-up, not a UI redesign or a request-behavior migration.

## Goals / Non-Goals

**Goals:**

- Model the bounded page request filter as a closed frontend union: `PARENT | CHILD | FLAT`.
- Serialize the canonical uppercase selector exactly and retain all applicable page, parent, and section parameters.
- Keep `FLAT` and `CHILD` pages isolated in TanStack Query keys.
- Preserve nullable or unsupported response `kind` values for legacy records and never introduce `FLAT` as a persisted response kind.
- Make the existing Explorer behavior and its partial-failure guarantees explicit in tests.

**Non-Goals:**

- Change the backend contract or duplicate backend cleanup/reprocessing work.
- Add `FLAT` to a persisted chunk-kind type or rewrite response records.
- Change the Chunk Explorer layout, URL state, paging size, direct lookup strategy, or compatibility-route policy.
- Add a new runtime dependency or generate frontend types from OpenAPI.

## Decisions

### Use a request-only kind type

Define an exported page-filter type such as `ChunkPageKind = 'PARENT' | 'CHILD' | 'FLAT'` and a shared `ChunkPageFilters` shape. Apply it to `documentsApi.chunkPage`, `useDocumentChunkPageQuery`, and the chunk-page query-key factories. The response `DocumentChunk.kind` remains `string | null` because it describes stored data and must preserve legacy null/unsupported values.

Alternatives considered: narrowing `DocumentChunk.kind` would conflate a read selector with persisted data and could make historical responses impossible to represent; retaining `string` for request filters would preserve the contract gap.

### Serialize canonical values without client-side reinterpretation

The API layer will send the typed selector verbatim, so the Explorer request remains `kind=FLAT` and `PARENT`/`CHILD` requests remain unchanged. Backend case-insensitive normalization remains a server concern; the frontend type and call sites use the documented uppercase values.

Alternatives considered: silently normalizing arbitrary strings would hide invalid callers instead of preventing them at the type boundary.

### Preserve cache identity and branch independence

The existing kind segment stays in every chunk-page key, and the type is threaded through the key factory so `FLAT` cannot share a cache entry with `CHILD`. Existing hierarchy, child, flat, and direct keys remain separate. Component tests continue to assert that a flat-page error does not remove hierarchy or direct detail state.

### Treat backend integration as an external rollout dependency

Frontend mocks verify URL serialization and UI behavior, but they cannot detect server-side validation drift. The backend commit `2c4527b` is the contract prerequisite and already supplies backend coverage; frontend verification will document that dependency and focus on the client boundary and Explorer states.

Live verification uses a fixed-character document because that is a supported production processing path. Mixed hierarchy/flat compatibility remains fixture-driven: one processing run snapshots one strategy, replacement removes the prior document chunk population, and the production persistence adapter rejects an unparented `CHILD` in a hierarchy batch. Requiring the running system to create a mixed document would therefore test an unsupported data-construction path rather than the frontend contract.

## Risks / Trade-offs

- [The new type exposes hidden arbitrary-string callers] → Update every chunk-page caller and let TypeScript identify unsupported values; do not widen the type to restore convenience.
- [A response type is narrowed accidentally] → Keep `DocumentChunk.kind` nullable/string-compatible and add a legacy response fixture assertion.
- [A cache key omits or conflates a filter] → Add explicit `FLAT` versus `CHILD` key assertions alongside existing parent/section/page isolation checks.
- [Frontend mocks pass while an older backend still rejects `FLAT`] → Require backend `2c4527b` in rollout notes and retain exact URL tests plus live/manual verification against the deployed backend.

## Migration Plan

1. Add the shared request filter types and thread them through the API, hooks, and query keys.
2. Update or add API tests for exact `kind=FLAT` serialization and response-kind preservation.
3. Add or update Chunk Explorer tests for fixture-driven mixed compatibility, flat-page failures, and direct unparented-child selection.
4. Run the frontend quality gates and verify a fixed-character document through the Explorer against a backend containing the `2c4527b` contract.

Rollback is a source revert only; the change does not alter persisted data or frontend routes.

## Open Questions

None. The backend virtual-selector semantics and deployment order are fixed by `CONTRACT_FIX.md` and commit `2c4527b`.
