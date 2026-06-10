## ADDED Requirements

### Requirement: API modules expose hybrid search endpoint hook
The system SHALL expose typed API support for the hybrid search endpoint through the query API module and a TanStack Query mutation hook.

#### Scenario: Feature component submits hybrid search
- **WHEN** a feature component triggers hybrid search for a selected knowledge base
- **THEN** the component SHALL consume a typed API-module mutation hook for `POST /knowledge-bases/{knowledgeBaseId}/queries/hybrid-search`

#### Scenario: Hybrid search request is serialized
- **WHEN** hybrid search is requested
- **THEN** the API module SHALL send a JSON body containing `query`, `topK`, `graphDepth`, and `includeChunkText` using the shared API client helpers

#### Scenario: Hybrid search response is parsed
- **WHEN** the backend returns a successful hybrid search response
- **THEN** the API module SHALL parse it into typed response fields for query metadata, hit metadata, source metadata, optional chunk text, graph entities, and graph relationships

#### Scenario: Hybrid search request fails
- **WHEN** the backend returns a validation or service error for hybrid search
- **THEN** the shared API client error normalization SHALL provide the Hybrid search workflow with the same `ApiError` contract used by other query endpoints
