## 1. API Contract

- [x] 1.1 Add hybrid search request, response, hit, source, graph entity, graph relationship, and graph context DTO types to `src/api/types.ts`.
- [x] 1.2 Add `queriesApi.hybridSearch(knowledgeBaseId, payload)` using JSON `POST /knowledge-bases/{knowledgeBaseId}/queries/hybrid-search`.
- [x] 1.3 Add `useHybridSearchMutation` to `src/api/queries.ts` with typed knowledge base id and payload arguments.
- [x] 1.4 Extend query API tests to cover hybrid search request serialization, response parsing, and normalized error behavior.

## 2. Queries Page UI

- [x] 2.1 Add independent Hybrid search draft state for query text, `topK`, `graphDepth`, and `includeChunkText`.
- [x] 2.2 Add a Hybrid search endpoint tab to the Queries controller page without removing or regressing the existing Ask query, Generate Cypher, Validate Cypher, and Execute Cypher tabs.
- [x] 2.3 Block hybrid search submission when `topK` is below 1 or `graphDepth` is below 0, and render visible validation feedback while preserving user input.
- [x] 2.4 Submit hybrid search through `useHybridSearchMutation` using the selected knowledge base id and show the existing request progress treatment while pending.
- [x] 2.5 Render hybrid search response summary fields: query, applied `topK`, applied `graphDepth`, `includeChunkText`, hit count, and execution time.
- [x] 2.6 Render ranked hits with chunk id, document id, chunk index, score, source metadata, optional chunk text, and an empty state when no hits are returned.
- [x] 2.7 Render graph entities and relationships for each hit with labels, identifiers, types, and structured properties without adding a graph visualization dependency.
- [x] 2.8 Render inline hybrid search error feedback using the normalized error message while keeping the search inputs stable.

## 3. Tests

- [x] 3.1 Extend Queries page tests to verify the Hybrid search tab is present with existing query tabs.
- [x] 3.2 Add workflow tests for successful hybrid search submission, selected knowledge base scoping, pending-state behavior, response summary rendering, hit rendering, graph context rendering, and empty results.
- [x] 3.3 Add workflow tests for invalid local option bounds and backend hybrid search failure feedback.

## 4. Validation

- [x] 4.1 Run `npm run lint`.
- [x] 4.2 Run `npm run test:run`.
- [x] 4.3 Run `npm run build`.
