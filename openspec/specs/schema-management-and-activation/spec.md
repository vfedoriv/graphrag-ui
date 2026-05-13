## Purpose

This specification defines the required behavior for schema management and activation in the GraphRAG admin UI.
## Requirements
### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas in a top section and expose schema operations as tabs on the Schemas page, including create schema, get schema by ID, and validate schema YAML.

#### Scenario: Schemas page groups operations as endpoint tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display schema list/context first and expose create/get-by-id/validate operations as separate tabs on the same page

### Requirement: Users can activate a schema for a selected knowledge base
The system SHALL allow activating a selected schema against the currently selected knowledge base from within the Schemas controller page workflow area.

#### Scenario: Activate schema within tabbed Schemas page
- **WHEN** a user chooses a schema and confirms activation with an active knowledge base selected
- **THEN** the system SHALL call schema activation endpoint and refresh active-schema-related views without leaving the Schemas page

### Requirement: Schema activation and validation failures are visible
The system SHALL show explicit error feedback when schema activation requests fail and when schema YAML validation requests fail.

#### Scenario: Activation fails
- **WHEN** schema activation request fails
- **THEN** the system SHALL render a visible activation failure alert in the Schemas page context

#### Scenario: Validate YAML request fails
- **WHEN** schema validation endpoint request fails
- **THEN** the system SHALL render a visible validation failure alert in the Validate schema tab

### Requirement: Schema activation table action is workflow tested
The system SHALL include workflow tests verifying schema activation can be triggered from the schemas table row action and calls the expected endpoint.

#### Scenario: Activate schema from list row
- **WHEN** a user clicks Activate for a schema row with a selected knowledge base
- **THEN** tests SHALL verify the activation endpoint call and related query invalidation effects

### Requirement: Schema YAML authoring areas are format-aware
The system SHALL treat schema YAML input and output areas as YAML-aware fields with syntax-oriented visual presentation and format guidance.

#### Scenario: Edit schema YAML input
- **WHEN** a user edits schema YAML content in create/validate/generate workflows
- **THEN** the field SHALL present YAML-aware syntax formatting cues and explicit YAML format indication

### Requirement: Schema source types match backend contract
The system SHALL expose and process only backend-supported schema source types: `PREDEFINED` and `GENERATED`.

#### Scenario: Source type options exclude unsupported values
- **WHEN** a user views schema source type fields, filters, or labels in schema workflows
- **THEN** the system SHALL present only `PREDEFINED` and `GENERATED` and SHALL NOT expose `USER_DEFINED`

#### Scenario: Schema payloads use supported source types only
- **WHEN** the frontend submits schema-related requests that include source type
- **THEN** the system SHALL send only `PREDEFINED` or `GENERATED` values

#### Scenario: Unsupported source type from API is visibly handled
- **WHEN** the backend response contains a source type outside `PREDEFINED` and `GENERATED`
- **THEN** the system SHALL show a visible unsupported-source-type fallback state without remapping it to a supported value
