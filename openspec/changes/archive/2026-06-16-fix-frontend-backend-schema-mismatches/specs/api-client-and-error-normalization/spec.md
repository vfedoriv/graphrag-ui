## MODIFIED Requirements

### Requirement: Backend ProblemDetail responses are normalized
The system SHALL normalize backend error responses into a shared frontend error model that supports field-level and request-level UI display, and normalization behavior SHALL be covered by regression tests for representative backend error shapes including field maps, string-valued field maps, and request-level error arrays.

#### Scenario: Display field errors from validation response
- **WHEN** backend returns validation failures with named fields
- **THEN** the system SHALL map those field errors into form-level displays for corresponding inputs

#### Scenario: Normalize string-valued field errors
- **WHEN** backend returns validation failures as a field map whose values are strings
- **THEN** the system SHALL normalize each field value into the shared field-error collection shape

#### Scenario: Preserve request-level error list
- **WHEN** backend returns request-level errors as a string array
- **THEN** the system SHALL preserve those errors in the normalized API error details without treating array indexes as field names

### Requirement: API modules expose hybrid search endpoint hook
The system SHALL expose typed API support for the hybrid search endpoint through the query API module and a TanStack Query mutation hook, using DTO types that match the current backend response contract.

#### Scenario: Feature component submits hybrid search
- **WHEN** a feature component triggers hybrid search for a selected knowledge base
- **THEN** the component SHALL consume a typed API-module mutation hook for `POST /knowledge-bases/{knowledgeBaseId}/queries/hybrid-search`

#### Scenario: Hybrid search request is serialized
- **WHEN** hybrid search is requested
- **THEN** the API module SHALL send a JSON body containing `query`, `topK`, `graphDepth`, and `includeChunkText` using the shared API client helpers

#### Scenario: Hybrid search response is parsed
- **WHEN** the backend returns a successful hybrid search response
- **THEN** the API module SHALL parse it into typed response fields for query metadata, hit metadata, source metadata, optional chunk text, graph entities under `graph.entities`, and graph relationships under `graph.relationships`

#### Scenario: Hybrid search relationship endpoints are typed
- **WHEN** the backend returns hybrid search graph relationships
- **THEN** the API module SHALL expose relationship endpoint fields as `startNodeElementId` and `endNodeElementId`

#### Scenario: Hybrid search request fails
- **WHEN** the backend returns a validation or service error for hybrid search
- **THEN** the shared API client error normalization SHALL provide the Hybrid search workflow with the same `ApiError` contract used by other query endpoints
