## Purpose

This specification defines the required behavior for api client and error normalization in the GraphRAG admin UI.

## Requirements

### Requirement: API client enforces typed request and response handling
The system SHALL provide typed API modules and shared fetch helpers for JSON and multipart requests across all feature domains.

#### Scenario: Send multipart upload with typed response parsing
- **WHEN** document upload is requested
- **THEN** the system SHALL send multipart form payload through shared API helper and parse the typed backend response shape

### Requirement: Backend ProblemDetail responses are normalized
The system SHALL normalize backend error responses into a shared frontend error model that supports field-level and request-level UI display.

#### Scenario: Display field errors from validation response
- **WHEN** backend returns validation failures with named fields
- **THEN** the system SHALL map those field errors into form-level displays for corresponding inputs
