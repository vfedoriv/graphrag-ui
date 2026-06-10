## Context

The Queries page currently exposes one-shot ask, Cypher generation, validation, and execution as endpoint tabs backed by typed API functions and TanStack Query mutation hooks. Backend commit `833e7aa` adds a knowledge-base-scoped hybrid search endpoint:

- `POST /api/v1/knowledge-bases/{knowledgeBaseId}/queries/hybrid-search`
- Request: `{ query: string, topK?: number, graphDepth?: number, includeChunkText?: boolean }`
- Response: `{ query, topK, graphDepth, includeChunkText, hits, hitCount, executionTimeMs }`
- Each hit includes chunk identity, document identity, score, optional text, source metadata, and graph context with entities and relationships.

The frontend should consume the endpoint through same-origin `/api` proxying and should not alter backend contracts from this repository.

## Goals / Non-Goals

**Goals:**

- Add typed request and response models for the backend hybrid search DTOs.
- Add `queriesApi.hybridSearch` and a React mutation hook for the endpoint.
- Add a Hybrid search tab to the Queries controller page using the active knowledge base id.
- Provide controls for the natural-language query, hit limit, graph depth, and chunk text inclusion.
- Render response summary, ranked hits, source metadata, optional text, graph entities, and graph relationships in a readable operator workflow.
- Preserve existing ask, generate, validate, and execute workflows.
- Add focused API and page workflow tests.

**Non-Goals:**

- No backend API contract changes.
- No search result persistence, pagination, saved searches, or cross-knowledge-base search.
- No graph visualization dependency; graph context can be displayed as structured lists/previews.
- No changes to authentication, authorization, routing, or deployment.

## Decisions

1. Extend the existing query API module.

   Hybrid search is part of the backend Queries controller and shares the same knowledge-base scope as ask/generate/validate/execute. Adding the raw API function and mutation hook to `src/api/queries.ts` preserves the existing feature organization and makes it easy for tests to cover the request path.

2. Model backend DTOs explicitly in `src/api/types.ts`.

   The response contains nested graph/source structures that are reused by both the API module and UI. Explicit types keep the backend contract visible and avoid untyped `unknown` handling in the feature page. Nested `properties` objects should use `Record<string, unknown>` to reflect arbitrary Neo4j properties.

3. Add a dedicated Hybrid search tab on the Queries page.

   The app's controller pattern maps endpoint workflows to tabs for query operations. A dedicated tab keeps hybrid search distinct from Cypher ask/generate workflows while sharing the selected knowledge base context and pending progress banner.

4. Keep hybrid search input state separate from Cypher draft state.

   Hybrid search uses `query`, `topK`, `graphDepth`, and `includeChunkText`, while existing tabs share prompt/Cypher/parameter drafts. Separate state avoids accidental coupling and prevents hybrid search submissions from overwriting Cypher drafts.

5. Render graph context as structured, bounded output rather than a visual graph.

   The backend already bounds graph expansion. The first frontend iteration should show entities, relationships, properties, and source context in tables or JSON previews using existing primitives. A custom graph visualization would introduce new layout and dependency risk without being necessary to use the endpoint.

## Risks / Trade-offs

- Backend default/clamp values may differ from UI defaults -> Send explicit conservative defaults and render applied `topK`, `graphDepth`, and `includeChunkText` from the response summary.
- Numeric inputs can produce invalid values -> Clamp or block client submission for `topK < 1` and `graphDepth < 0`, while still surfacing backend validation errors.
- Large graph properties can make hit cards noisy -> Use compact summaries plus JSON previews for nested properties instead of expanding every property inline.
- Existing Queries page can become crowded -> Keep hybrid search in its own tab and preserve current tab order for existing workflows.
- Backend may omit chunk text when `includeChunkText` is false -> Render text conditionally and avoid empty placeholders.
