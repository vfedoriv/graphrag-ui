## Why

The backend now exposes `POST /api/v1/knowledge-bases/{knowledgeBaseId}/queries/hybrid-search`, but the admin UI does not provide a way to run it. Users need a controller-page workflow for hybrid search so they can retrieve ranked document chunk evidence and inspect graph context from the selected knowledge base without leaving the frontend.

## What Changes

- Add a Hybrid search endpoint workflow to the Queries controller page.
- Add typed frontend request/response DTOs, API function, and TanStack Query mutation hook for the hybrid search endpoint.
- Let users submit natural-language search text with bounded retrieval options: `topK`, `graphDepth`, and `includeChunkText`.
- Display hybrid search response metadata, ranked hits, source metadata, optional chunk text, and graph entities/relationships in the existing controller output style.
- Surface pending and error states consistently with existing query generate, validate, execute, and ask workflows.
- Cover the API module and workflow behavior with focused regression tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `query-authoring-and-execution`: Add a user-facing hybrid search workflow to the Queries controller page.
- `controller-page-tabbed-endpoint-workflows`: Add Hybrid search as a dedicated endpoint tab on the tabbed Queries controller page.
- `api-client-and-error-normalization`: Extend typed query endpoint modules and hooks to include hybrid search.

## Impact

- Affected frontend code: `src/api/types.ts`, `src/api/queries.ts`, `src/features/queries/QueriesPage.tsx`, and related tests.
- Backend dependency: commit `833e7aa` in `/home/vitaliy/workspace/graphrag` adds the hybrid search endpoint and DTO contract.
- API contract consumed by this change: `POST /knowledge-bases/{knowledgeBaseId}/queries/hybrid-search` with `{ query, topK, graphDepth, includeChunkText }` and response fields `{ query, topK, graphDepth, includeChunkText, hits, hitCount, executionTimeMs }`.
- No authentication, routing, deployment, or backend contract changes are introduced by this frontend change.
