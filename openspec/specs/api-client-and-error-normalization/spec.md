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

### Requirement: API client preserves machine-readable admission conflicts
The system SHALL preserve machine-readable readiness blockers and other safe structured fields from backend ProblemDetail responses so advanced operational workflows can present actionable `409` admission failures without reparsing error message text.

#### Scenario: Advanced-search readiness conflict is normalized
- **WHEN** advanced-search admission returns HTTP `409` with blocker objects
- **THEN** the normalized `ApiError` SHALL preserve the blocker codes and descriptions for the readiness UI

#### Scenario: Chunk migration target changes
- **WHEN** migration creation returns HTTP `409` because readiness or the previewed target changed
- **THEN** the normalized error SHALL retain the status and safe structured detail needed to trigger a fresh preview

### Requirement: API modules expose advanced-operation workflow hooks
The system SHALL expose typed query and mutation hooks plus reusable raw functions for chunking state, bounded chunk reads, migration previews and plans, and advanced-search readiness and runs.

#### Scenario: Feature consumes advanced-operation endpoint
- **WHEN** a Chunking or Advanced Search component needs a backend resource or command
- **THEN** it SHALL consume the corresponding typed API-module hook and shared normalized error behavior

#### Scenario: Test invokes raw operation
- **WHEN** an API contract test needs to assert an exact route or payload
- **THEN** it SHALL be able to call the exported raw API operation without rendering React

### Requirement: No frontend request targets the deleted hybrid-search endpoint
The system SHALL remove Hybrid Search request/response DTOs, raw API functions, mutation hooks, and tests and SHALL ensure no production or test request targets `/queries/hybrid-search`.

#### Scenario: Search functionality is invoked
- **WHEN** a user submits search from the supported frontend
- **THEN** the request SHALL target the advanced-search run route family
- **AND** SHALL NOT target the deleted Hybrid Search endpoint

### Requirement: Unsupported advanced-search results use normalized explicit state
The system SHALL expose unsupported and malformed successful result payloads to the Advanced Search UI as explicit diagnosable states rather than raw runtime exceptions or coerced version-one data.

#### Scenario: Successful HTTP result has unsupported payload
- **WHEN** the API returns HTTP success with an unsupported or inconsistent payload version
- **THEN** the client SHALL retain raw JSON and provide a stable unsupported-result state

#### Scenario: Successful version-one payload is malformed
- **WHEN** the API returns HTTP success with version 1 but invalid required structure
- **THEN** the client SHALL retain raw JSON and provide a stable malformed-result state
