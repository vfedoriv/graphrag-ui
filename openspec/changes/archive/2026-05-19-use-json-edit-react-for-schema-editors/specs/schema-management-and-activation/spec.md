## MODIFIED Requirements

### Requirement: Schema YAML authoring areas are format-aware
The system SHALL treat schema JSON input and output areas as structured JSON editors with explicit JSON format indication, visible parse or validation feedback, and support for adding, removing, moving, and editing JSON schema nodes.

#### Scenario: Edit schema YAML input
- **WHEN** a user edits schema JSON content in create/validate/generate workflows
- **THEN** the field SHALL present a structured JSON editing interface with explicit JSON format indication and controls for editing schema nodes

#### Scenario: Submit structured schema JSON for validation
- **WHEN** a user validates schema JSON that was edited through the structured editor
- **THEN** the system SHALL submit the edited JSON content to the schema validation endpoint without changing the backend contract

#### Scenario: Submit structured schema JSON for creation
- **WHEN** a user creates a schema from JSON that was edited through the structured editor
- **THEN** the system SHALL submit the edited JSON content to the schema creation endpoint without changing the backend contract

### Requirement: Schema workflow results remain stable across failed retries
The system SHALL preserve existing user-editable schema draft content when a schema validation, creation, or retrieval request fails, including schema JSON content edited through the structured editor.

#### Scenario: Schema validation fails after draft edit
- **WHEN** a user edits schema JSON and a validation request fails
- **THEN** the system SHALL keep the edited schema JSON visible and render an inline validation failure alert

#### Scenario: Schema creation fails after structured draft edit
- **WHEN** a user edits schema JSON through the structured editor and a create request fails
- **THEN** the system SHALL keep the edited schema JSON draft visible and render an inline creation failure alert
