## Context

Chunk Explorer currently treats hierarchy and flat chunks as independent branches that may coexist. The coordinated backend change `enforce-exclusive-document-chunk-topology` instead classifies every successful document as empty, pure flat, or pure hierarchy and returns RFC 7807 `409 Conflict` for an invalid mixed collection. Fixed-character documents remain pure flat and continue to use virtual `kind=FLAT`; recursive documents remain hierarchical.

The frontend already loads the hierarchy summary before enabling the FLAT page query, so the exclusive mode can be derived without adding an endpoint or changing shared DTOs.

## Goals / Non-Goals

**Goals:**

- Render exactly one bounded outline mode for each valid processed document.
- Preserve pure-flat paging, pure-hierarchy parent expansion, direct detail, and deep-link behavior.
- Present topology conflicts as document-integrity failures rather than simultaneous branches.
- Remove mixed-only UI assertions and fixtures after the backend invariant is deployed.

**Non-Goals:**

- Remove `kind=FLAT`, `flatChunkCount`, `ChunkPageKind`, or fixed-character support.
- Change API routes, query-key dimensions, page sizes, response-kind nullability, or ownership behavior.
- Repair invalid backend data from the browser.
- Deploy before backend change `enforce-exclusive-document-chunk-topology`.

## Decisions

### Derive one outline mode from the hierarchy envelope

After a successful hierarchy response, derive `EMPTY` when parent total and `flatChunkCount` are both zero, `FLAT` when parent total is zero and flat count is positive, and `HIERARCHICAL` when parent total is positive and flat count is zero. Enable the FLAT page query only in `FLAT` mode and render parent summaries only in `HIERARCHICAL` mode.

Alternatives considered: retaining two independently visible branches preserves the removed mixed contract; using chunk strategy settings would be incorrect because existing documents retain the strategy snapshotted during their own processing run.

### Treat backend 409 as an integrity-level document state

When the hierarchy request returns `409` with `Document chunk topology is invalid`, show a dedicated integrity alert, suppress collection outlines, and keep any already-authoritative direct detail visible. The UI may offer a hierarchy refetch, but it SHALL not imply that paging another branch can repair the document.

Alternatives considered: displaying the generic hierarchy-page error hides the invariant; reconstructing a mode from direct chunks or other page calls would bypass the backend decision and reintroduce mixed support.

### Keep the API and cache contracts unchanged

The frontend continues to send exact `kind=FLAT` for pure-flat pages and retains separate hierarchy, page, parent, section, and direct query keys. No request/response type needs narrowing because persisted chunks remain `CHILD` and legacy nullability is an independent wire concern.

Alternatives considered: deleting FLAT types or keys would break the supported fixed-character path and conflate topology exclusivity with selector removal.

## Risks / Trade-offs

- [Frontend deploys before backend enforcement] → Gate rollout and live verification on the named backend change being deployed.
- [A stale hierarchy cache displays an obsolete mode after replacement] → Preserve existing document-scoped invalidation and test flat-to-hierarchy and hierarchy-to-flat transitions.
- [Direct detail and integrity alert appear contradictory] → Label direct detail as authoritative diagnostic data while suppressing invalid collection navigation.
- [Pure-flat behavior regresses while mixed fixtures are removed] → Replace mixed tests with canonical fixed-character fixtures and exact `kind=FLAT` request assertions.

## Migration Plan

1. Deploy and verify backend change `enforce-exclusive-document-chunk-topology` after its zero-invalid-row audit.
2. Add exclusive outline-mode derivation and topology-conflict presentation.
3. Replace mixed fixtures with pure-flat, pure-hierarchy, transition, empty, and `409` fixtures.
4. Run frontend quality gates and live-smoke one recursive and one fixed-character document.

Rollback restores simultaneous branch rendering. API routes and persisted data are unchanged, so rollback requires no data migration.

## Open Questions

None.
