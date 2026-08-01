## ADDED Requirements

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
