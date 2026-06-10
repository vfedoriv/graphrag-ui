## Purpose

This specification defines the required behavior for api client and error normalization in the GraphRAG admin UI.
## Requirements
### Requirement: API client enforces typed request and response handling
The system SHALL provide typed API modules and shared fetch helpers for JSON and multipart requests across all feature domains, and these modules SHALL have automated tests for success and failure paths of high-risk request flows. Shared API helpers SHALL normalize transport failures and malformed successful payloads into `ApiError` values so UI consumers receive a consistent error contract.

#### Scenario: Send multipart upload with typed response parsing
- **WHEN** document upload is requested
- **THEN** the system SHALL send multipart form payload through shared API helper and parse the typed backend response shape

#### Scenario: Transport failure is normalized
- **WHEN** a request fails before receiving an HTTP response (for example offline or aborted fetch)
- **THEN** the shared API helper SHALL reject with `ApiError` containing a stable user-facing message and structured details

#### Scenario: Malformed success payload is normalized
- **WHEN** a successful HTTP response contains non-JSON or malformed JSON where JSON is expected
- **THEN** the shared API helper SHALL reject with `ApiError` instead of raw runtime parsing errors

### Requirement: Backend ProblemDetail responses are normalized
The system SHALL normalize backend error responses into a shared frontend error model that supports field-level and request-level UI display, and normalization behavior SHALL be covered by regression tests for representative backend error shapes.

#### Scenario: Display field errors from validation response
- **WHEN** backend returns validation failures with named fields
- **THEN** the system SHALL map those field errors into form-level displays for corresponding inputs

### Requirement: API client edge success branches are regression tested
The system SHALL include tests for API client success branches that return no JSON payload, including explicit 204 responses and empty response bodies.

#### Scenario: 204 response handling
- **WHEN** API helper receives an HTTP 204 success response
- **THEN** tests SHALL verify the helper returns `undefined` without parse errors

#### Scenario: Empty body success handling
- **WHEN** API helper receives a successful non-204 response with empty text body
- **THEN** tests SHALL verify the helper returns `undefined` without parse errors

### Requirement: ProblemDetail fallback normalization branches are tested
The system SHALL include tests that verify normalization behavior when backend error payloads are partial or absent.

#### Scenario: Title-only payload
- **WHEN** backend error payload includes `title` without `detail`
- **THEN** tests SHALL verify normalized error message falls back to the title

#### Scenario: Null payload
- **WHEN** backend error payload cannot be parsed and is treated as null
- **THEN** tests SHALL verify normalized error message uses default fallback

### Requirement: API modules expose endpoint workflow hooks
The system SHALL expose typed TanStack Query hooks from API modules for backend endpoint workflows so feature components can consume standardized async state and error behavior.

#### Scenario: Feature component needs to run backend command
- **WHEN** a feature component triggers a backend command such as schema validation, schema generation, schema retrieval, document processing, query generation, query validation, query execution, or ask
- **THEN** the component SHALL consume a typed API-module query or mutation hook for that command

#### Scenario: API endpoint remains reusable outside React
- **WHEN** a test or non-React helper needs the raw API function
- **THEN** the API module MAY keep the raw function exported while production feature components use the hook wrapper

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
