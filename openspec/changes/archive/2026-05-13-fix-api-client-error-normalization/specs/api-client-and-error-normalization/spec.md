## MODIFIED Requirements

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
