## ADDED Requirements

### Requirement: Schema retrieval and validation use standardized async state
The system SHALL run schema get-by-id and schema validation workflows through typed TanStack Query or mutation hooks and SHALL present pending, success, and error state from those hooks.

#### Scenario: Validate schema JSON
- **WHEN** a user submits schema JSON for validation
- **THEN** the system SHALL run the validation through an API-module mutation hook and render validation result or error state from that mutation

#### Scenario: Get schema by id
- **WHEN** a user requests schema details by id
- **THEN** the system SHALL run the retrieval through an API-module query or mutation hook and render the latest successful result or error state from that hook

### Requirement: Schema workflow results remain stable across failed retries
The system SHALL preserve existing user-editable schema draft content when a schema validation, creation, or retrieval request fails.

#### Scenario: Schema validation fails after draft edit
- **WHEN** a user edits schema JSON and a validation request fails
- **THEN** the system SHALL keep the edited schema JSON visible and render an inline validation failure alert
