## Why

Durable runs are only useful when their versioned results become readable answers with traceable evidence and honest failure states. The frontend must render the typed result contract without inventing citation offsets or coercing unsupported payloads, and it must complete the transition away from the deleted Hybrid Search endpoint.

## What Changes

- Automatically fetch results only for `COMPLETED` or `PARTIAL` runs and validate both envelope and nested payload versions before rendering.
- Present answer status, readable answer text, confidence, limitations, claim cards, citation chips, ranked evidence, context-only entries, and graph facts with their references.
- Prefer snapshotted source display metadata, use current document metadata only as an optional legacy fallback, and handle missing excerpts or nullable provenance explicitly.
- Link citations to `/chunking?view=chunks&documentId=...&chunkId=...` without fabricating inline citation positions in answer text.
- Keep planning, sufficiency, follow-up, retrieval attempts, fusion, graph expansion, parent context, reranking, selection, metadata warnings, answer diagnostics, and raw JSON in collapsed operator sections.
- Show explicit insufficient-evidence, answer-unavailable, malformed-result, and unsupported-version states while preserving raw diagnostic JSON.
- **BREAKING** Remove the obsolete Hybrid Search tab, DTOs, API call, mutation hook, tests, runtime-setting hints, pending aggregation, and stale OpenSpec requirements because the backend endpoint no longer exists.
- Add deterministic result and cross-workspace citation E2E coverage with mocked `/api/v1` responses.

## Capabilities

### New Capabilities

- `cited-search-result-presentation`: Version-aware readable advanced-search answers, evidence, graph facts, diagnostics, legacy citation fallbacks, and Chunking deep links.

### Modified Capabilities

- `query-authoring-and-execution`: Retire Hybrid Search while retaining Ask, Generate Cypher, Validate Cypher, and Execute Cypher unchanged.
- `api-client-and-error-normalization`: Remove the deleted hybrid-search contract and require explicit malformed/unsupported advanced-search result handling.
- `runtime-properties-management`: Remove Hybrid Search workflow hints while leaving advanced-search tuning in generic Settings.

## Impact

This change affects Advanced Search result components, Queries, query API/types, Settings copy, diagnostics rendering, citation navigation, and unit/E2E tests. It depends on `add-advanced-search-run-management` and `add-scalable-chunk-explorer`.
