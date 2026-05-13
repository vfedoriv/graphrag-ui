## ADDED Requirements

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
