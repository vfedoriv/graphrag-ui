## Why

The coordinated backend change `enforce-exclusive-document-chunk-topology` makes successful document output either pure flat or pure hierarchy and rejects mixed collections. Chunk Explorer should adopt that invariant instead of retaining simultaneous hierarchy/flat navigation for a state the supported backend flow cannot create.

## What Changes

- **BREAKING** Remove mixed hierarchy-and-flat navigation as a supported frontend state after the coordinated backend is deployed.
- Render exactly one bounded outline mode per processed document: empty, flat, or hierarchical.
- Retain virtual `kind=FLAT`, fixed-character document paging, persisted response `kind=CHILD`, direct lookup, deep links, and complete-list route avoidance.
- Treat backend topology-conflict responses as an explicit document-integrity error rather than a branch-specific retry state.
- Replace mixed-population fixtures and assertions with pure-flat, pure-hierarchy, empty, and topology-conflict coverage.
- Gate frontend rollout on deployment of backend change `enforce-exclusive-document-chunk-topology`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scalable-chunk-inspection`: Make flat and hierarchical Chunk Explorer modes mutually exclusive and define handling for backend topology conflicts.

## Impact

This affects `ChunkExplorer`, its hierarchy/flat query enablement and rendering conditions, UI copy, component/API fixtures, and the scalable chunk inspection specification. Shared `ChunkPageKind`, `kind=FLAT` serialization, query keys, DTO nullability, and backend route shapes remain unchanged.
