## Context

The frontend currently centralizes most DTOs in `src/api/types.ts`, keeps document chunk reads in `src/api/documents.ts`, keeps one-shot query commands in `src/api/queries.ts`, and embeds reprocessing contracts in the schema-draft feature. The backend baseline through `c5dc2a2` adds multiple versioned/paged resources and generalizes reprocessing beyond schema activation. This change establishes shared contracts before any new page consumes them.

## Goals / Non-Goals

**Goals:**

- Mirror current backend wire names and nullability without changing backend contracts.
- Give each operational resource stable, parameter-sensitive query keys and reusable raw API functions/hooks.
- Centralize reprocessing types and parsing while keeping schema-draft behavior compatible.
- Make polling and result-version decisions deterministic and testable.

**Non-Goals:**

- Add Chunking or Advanced Search pages.
- Remove the Hybrid Search UI before its replacement result experience exists.
- Generate DTOs from OpenAPI or add a new runtime dependency.

## Decisions

### Separate domain API modules from feature rendering

Introduce focused modules for chunking state, chunk reads, reprocessing plans/migration previews, and advanced-search runs. Keep raw request functions exported and layer TanStack Query hooks over them. This follows the existing API-module pattern while avoiding a single oversized query module. Keeping all additions in `types.ts` was considered, but it would preserve the current coupling and make ownership unclear.

### Encode every server filter in stable query keys

Page, size, status, reason, selection, document ID, chunk kind, parent ID, and section index become query-key inputs. Disabled variants use explicit sentinel segments. This prevents filtered pages from sharing cache entries and makes knowledge-base invalidation predictable.

### Treat payload version as a runtime boundary

The result API returns a typed TypeScript shape, but success parsing must retain the raw response long enough to verify both envelope `payloadVersion` and nested result `payloadVersion`. A mismatch or structurally malformed version-one result becomes an explicit parsed failure carrying raw diagnostic JSON. Blind casting or best-effort coercion is rejected because it can misassociate claims and citations.

### Poll focused resources, not whole collections

Expose terminal-status helpers and query options so consumers poll only selected non-terminal runs/plans. Advanced-search detail uses a 1.5-second interval and result queries enable only for `COMPLETED` or `PARTIAL`. This avoids collection churn and pre-result `409` traffic.

### Generalize reprocessing in a shared domain module

Move plan DTOs, endpoint functions, keys, parsing, and hooks out of schema drafts. Preserve schema-specific request construction in that feature, but support `reason`, `selection`, `expectedChunkerRevision`, new item status values, optional list filters, preview contracts, and `mode: RESNAPSHOT_UNRESOLVED`. The deprecated retry boolean is accepted only if needed by fixture parsing, never emitted by new requests.

### Preserve nullable legacy provenance

Chunk and evidence fields that may be absent on historical data remain nullable/optional at the boundary. UI packages must render missing provenance honestly rather than manufacture defaults.

## Risks / Trade-offs

- [Large DTO surface can drift from Java records] → Add exact route, payload, representative decoding, nullability, and version tests based on backend `c5dc2a2`.
- [Shared extraction can regress schema publication] → Move behavior without changing schema request semantics and retain focused schema-draft tests/fixtures.
- [Many query keys increase invalidation complexity] → Provide root key factories per domain and document expected invalidations beside mutation hooks.
- [Runtime validation duplicates static types] → Restrict runtime validation to externally versioned or strict workflow payloads where malformed data needs an explicit UI state.

## Migration Plan

1. Add DTOs, version guards, query keys, and raw endpoint functions.
2. Extract shared reprocessing code and migrate schema-draft imports without changing its UI.
3. Update validators, fixtures, and API tests.
4. Allow dependent workspace changes to adopt the new modules incrementally.

Rollback is limited to reverting this additive foundation together with any dependent workspace changes already applied.

## Open Questions

None. The frontend contract baseline is fixed at backend commit `c5dc2a2`.
