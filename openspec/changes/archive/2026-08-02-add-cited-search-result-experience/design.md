## Context

The backend returns `ResultResponse` with an envelope version and a typed `AdvancedSearchResultV1`. Answers refer to evidence and graph facts by IDs, while citations do not include answer-text offsets. New results snapshot source display metadata, but legacy version-one results can have null labels or text. The old Hybrid Search endpoint has been deleted.

## Goals / Non-Goals

**Goals:**

- Render version-one answers, claims, citations, evidence, contexts, graph facts, and diagnostics accessibly.
- Preserve traceability across missing/legacy metadata and cross-link evidence to direct chunk inspection.
- Fail explicitly for malformed or unsupported result versions.
- Remove all frontend Hybrid Search contracts and UI after the replacement is complete.

**Non-Goals:**

- Inject citation markers into answer prose without backend offsets.
- Coerce future payload versions into version one.
- Move runtime tuning controls into Advanced Search.

## Decisions

### Validate before semantic rendering

The result boundary verifies envelope version equals nested version and both equal 1, then verifies required answer/collection structure and referential integrity needed by rendering. Failure produces an unsupported or malformed state with collapsible raw JSON. Partial rendering of an untrusted graph was rejected because broken ID references can mislead users.

### Build lookup maps but retain server ordering

Evidence is displayed in backend rank order, contexts separately, and graph facts in response order. ID maps resolve claim citation chips and graph references without changing ordering or deduplicating server content. Missing referenced IDs are surfaced as diagnostics, not silently discarded.

### Keep answer prose and claims separate

Display answer text as returned. Claims become cards with their own citation/graph chips. Do not insert chips into prose because the contract has no offsets and text matching would fabricate positions.

### Resolve citation labels through a strict fallback chain

Use `sourceDisplayLabel`, then `sourceFilename`, then an already-cached current document filename, then `documentId`. The current document list is optional and must not block result rendering. Snapshot metadata remains visually identified as result-time source context.

### Make evidence links scalable and ownership-safe

Citation actions navigate to `/chunking?view=chunks&documentId={documentId}&chunkId={chunkId}`. The explorer owns direct lookup and KB reconciliation. Missing chunk IDs render non-linkable citations rather than malformed URLs.

### Layer information by user intent

Answer, confidence, limitations, claims, evidence, contexts, and graph facts are primary. Pipeline/answer diagnostics and raw JSON are collapsed operator sections. Explicit empty states cover insufficient evidence, unavailable answer, missing evidence text, and partial branch failures.

### Retire Hybrid Search atomically

Remove its DTOs, endpoint function, hook, tab, form state, result renderer, tests, runtime hints, and pending aggregation in this change. Ask and Cypher workflows remain unchanged. Keeping a disabled legacy tab was rejected because the endpoint is gone and would imply recoverability.

## Risks / Trade-offs

- [Referential inconsistencies block otherwise readable text] → Preserve raw JSON and explain the exact malformed relationship instead of silently presenting untraceable claims.
- [Legacy labels require document lookup] → Make fallback opportunistic and never delay the result on document-list failure.
- [Diagnostics dominate the page] → Collapse by default with concise warning summaries.
- [Hybrid removal reduces functionality if applied early] → Require run management and cited results to be implemented/validated before removing the legacy UI.

## Migration Plan

1. Apply contract, explorer, and run-management dependencies.
2. Add guarded result fetching and version/malformed states.
3. Add answer, claims, evidence/context, graph-fact, and diagnostic renderers.
4. Add citation deep links and legacy label fallback.
5. Remove Hybrid Search code/spec requirements and update regression/E2E coverage.

Rollback restores the Hybrid Search frontend only if deployed against a backend that still exposes that endpoint; against the current backend, rollback should instead retain Advanced Search and revert only presentation changes.

## Open Questions

None. Inline citation placement remains out of scope until the backend provides answer segments or offsets.
