## REMOVED Requirements

### Requirement: API modules expose hybrid search endpoint hook
**Reason**: The backend deleted `/queries/hybrid-search`; retaining its DTOs and hook would expose an unusable contract.

**Migration**: Use the typed advanced-search readiness, run, cancellation, and result API module introduced by the dependent contract and run-management changes.

## ADDED Requirements

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
