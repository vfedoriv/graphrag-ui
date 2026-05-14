## MODIFIED Requirements

### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas in a top section and expose schema operations as tabs on the Schemas page, including create schema, get schema by ID, and validate schema JSON.

#### Scenario: Schemas page groups operations as endpoint tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display schema list/context first and expose create/get-by-id/validate operations as separate tabs on the same page

### Requirement: Schema activation and validation failures are visible
The system SHALL show explicit error feedback when schema activation requests fail and when schema JSON validation requests fail.

#### Scenario: Activation fails
- **WHEN** schema activation request fails
- **THEN** the system SHALL render a visible activation failure alert in the Schemas page context

#### Scenario: Validate YAML request fails
- **WHEN** schema validation endpoint request fails
- **THEN** the system SHALL render a visible validation failure alert in the Validate schema tab

### Requirement: Schema YAML authoring areas are format-aware
The system SHALL treat schema JSON input and output areas as JSON-aware fields with syntax-oriented visual presentation and format guidance.

#### Scenario: Edit schema YAML input
- **WHEN** a user edits schema JSON content in create/validate/generate workflows
- **THEN** the field SHALL present JSON-aware syntax formatting cues and explicit JSON format indication
