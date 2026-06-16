## Purpose

This specification defines the required behavior for schema management and activation in the GraphRAG admin UI.
## Requirements
### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas related to the currently selected knowledge base in a top section and expose schema operations as tabs on the Schemas page, including create schema, get schema by ID, and validate schema JSON. Schema creation launched from the Schemas page with an active knowledge base selected SHALL include that knowledge base id in the create request payload. After a successful schema creation launched from the Schemas page with an active knowledge base selected, the system SHALL refresh the selected knowledge base's schema list and render the newly listed backend result when that scoped list includes the created schema.

#### Scenario: Schemas page groups operations as endpoint tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display knowledge-base-scoped schema list/context first and expose create/get-by-id/validate operations as separate tabs on the same page

#### Scenario: Selected knowledge base has no related schemas
- **WHEN** a user has an active knowledge base selected and that knowledge base has no associated schemas
- **THEN** the system SHALL show an empty-state message indicating there are no schemas for the selected knowledge base

#### Scenario: Create schema request includes selected knowledge base
- **WHEN** a user creates a schema while a knowledge base is selected
- **THEN** the system SHALL send `POST /api/v1/schemas` with the schema `content`, `sourceType`, and selected `knowledgeBaseId` in the JSON request body

#### Scenario: Created schema appears in selected knowledge base list
- **WHEN** a user creates a schema while a knowledge base is selected
- **AND** the backend's knowledge-base-scoped schema list includes the created schema after creation
- **THEN** the system SHALL refresh that selected knowledge base's schema list
- **AND** the system SHALL render the created schema in the Schemas page list without requiring a manual retry

#### Scenario: Duplicate schema creation remains an error
- **WHEN** schema creation is rejected because the immutable schema name and version already exist
- **THEN** the system SHALL render the backend conflict as visible create failure feedback
- **AND** the system SHALL NOT report a successful creation

### Requirement: Users can activate a schema for a selected knowledge base
The system SHALL allow activating a selected schema against the currently selected knowledge base from within the Schemas controller page workflow area, and SHALL render row activation controls according to each schema status.

#### Scenario: Activate schema within tabbed Schemas page
- **WHEN** a user chooses an inactive schema and confirms activation with an active knowledge base selected
- **THEN** the system SHALL call schema activation endpoint and refresh active-schema-related views without leaving the Schemas page

#### Scenario: Active schema row does not expose actionable activation
- **WHEN** a schema row is reported with `ACTIVE` status in the schema list
- **THEN** the row action SHALL show an active-state caption and SHALL be non-interactive

### Requirement: Schema list supports mutation actions
The system SHALL expose update and delete actions for schemas in the Schemas page list while preserving existing list, activation, create, get-by-id, and validation workflows.

#### Scenario: Schema list renders update and delete actions
- **WHEN** a user opens the Schemas page with schemas for the selected knowledge base
- **THEN** each schema row SHALL expose controls for update and delete in addition to the existing activation state/action

#### Scenario: Active schema mutation is guarded by backend response
- **WHEN** a schema update or delete request is rejected because the schema is active or otherwise conflicts with backend mutation rules
- **THEN** the system SHALL render the backend conflict as visible error feedback in the Schemas page context
- **AND** the system SHALL NOT remove the schema row or report a successful update

#### Scenario: Existing schema workflows remain available
- **WHEN** update and delete actions are added to the Schemas page
- **THEN** the existing generate, validate, create, get-by-id, and activate workflows SHALL remain available from the same controller page

### Requirement: Schema activation and validation failures are visible
The system SHALL show explicit error feedback when schema activation requests fail and when schema JSON validation requests fail.

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

### Requirement: Schema retrieval and validation use standardized async state
The system SHALL run schema get-by-id and schema validation workflows through typed TanStack Query or mutation hooks and SHALL present pending, success, and error state from those hooks.

#### Scenario: Validate schema JSON
- **WHEN** a user submits schema JSON for validation
- **THEN** the system SHALL run the validation through an API-module mutation hook and render validation result or error state from that mutation

#### Scenario: Get schema by id
- **WHEN** a user requests schema details by id
- **THEN** the system SHALL run the retrieval through an API-module query or mutation hook and render the latest successful result or error state from that hook

### Requirement: Schema workflow results remain stable across failed retries
The system SHALL preserve existing user-editable schema draft content when a schema validation, creation, or retrieval request fails, including schema JSON content edited through the structured editor.

#### Scenario: Schema validation fails after draft edit
- **WHEN** a user edits schema JSON and a validation request fails
- **THEN** the system SHALL keep the edited schema JSON visible and render an inline validation failure alert

#### Scenario: Schema creation fails after structured draft edit
- **WHEN** a user edits schema JSON through the structured editor and a create request fails
- **THEN** the system SHALL keep the edited schema JSON draft visible and render an inline creation failure alert
