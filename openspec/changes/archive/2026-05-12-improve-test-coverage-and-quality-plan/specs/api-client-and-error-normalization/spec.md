## MODIFIED Requirements

### Requirement: API client enforces typed request and response handling
The system SHALL provide typed API modules and shared fetch helpers for JSON and multipart requests across all feature domains, and these modules SHALL have automated tests for success and failure paths of high-risk request flows.

#### Scenario: Send multipart upload with typed response parsing
- **WHEN** document upload is requested
- **THEN** the system SHALL send multipart form payload through shared API helper and parse the typed backend response shape

### Requirement: Backend ProblemDetail responses are normalized
The system SHALL normalize backend error responses into a shared frontend error model that supports field-level and request-level UI display, and normalization behavior SHALL be covered by regression tests for representative backend error shapes.

#### Scenario: Display field errors from validation response
- **WHEN** backend returns validation failures with named fields
- **THEN** the system SHALL map those field errors into form-level displays for corresponding inputs
