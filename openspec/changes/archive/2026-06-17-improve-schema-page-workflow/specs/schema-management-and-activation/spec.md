## MODIFIED Requirements

### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas related to the currently selected knowledge base in a top section and expose schema operations as purpose-based workflow tabs on the Schemas page, including schema validation and schema creation. The schema list SHALL prioritize human-readable metadata and SHALL NOT show schema ID as a primary table column. Schema detail retrieval SHALL be available from each schema row without requiring the user to copy or enter the schema ID manually. Schema creation launched from the Schemas page with an active knowledge base selected SHALL include that knowledge base id in the create request payload. After a successful schema creation launched from the Schemas page with an active knowledge base selected, the system SHALL refresh the selected knowledge base's schema list and render the newly listed backend result when that scoped list includes the created schema.

#### Scenario: Schemas page groups operations by user purpose
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display knowledge-base-scoped schema list/context first
- **AND** the system SHALL expose schema validation and schema creation as purpose-based workflow tabs on the same page
- **AND** the system SHALL NOT require endpoint tab navigation to access those workflows

#### Scenario: Schema list hides implementation identifier column
- **WHEN** a user views the schema list for the selected knowledge base
- **THEN** the table SHALL show human-readable schema metadata such as name, version, source type, and status
- **AND** the table SHALL NOT include schema ID as a primary column

#### Scenario: Retrieve schema details from row action
- **WHEN** a user invokes the schema details action for a schema row
- **THEN** the system SHALL request that schema by the row's schema ID
- **AND** the system SHALL render the retrieved schema details in the Schemas page context without requiring manual schema ID entry

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
The system SHALL allow activating a selected schema against the currently selected knowledge base from the Schemas page list, and SHALL render row activation controls according to each schema status.

#### Scenario: Activate schema from Schemas page list
- **WHEN** a user chooses an inactive schema and confirms activation with an active knowledge base selected
- **THEN** the system SHALL call schema activation endpoint and refresh active-schema-related views without leaving the Schemas page

#### Scenario: Active schema row does not expose actionable activation
- **WHEN** a schema row is reported with `ACTIVE` status in the schema list
- **THEN** the row action SHALL show an active-state caption and SHALL be non-interactive

### Requirement: Schema list supports mutation actions
The system SHALL expose details, update, and delete actions for schemas in the Schemas page list while preserving existing list, activation, create, validation, and generation workflows. Row action controls SHALL be visually aligned in a stable action column independent of variable schema metadata in earlier columns.

#### Scenario: Schema list renders details, update, and delete actions
- **WHEN** a user opens the Schemas page with schemas for the selected knowledge base
- **THEN** each schema row SHALL expose controls for details, update, and delete in addition to the existing activation state/action

#### Scenario: Schema row actions stay aligned
- **WHEN** schema rows contain different schema names, versions, source types, or statuses
- **THEN** row action controls SHALL remain aligned in a consistent actions column
- **AND** action controls SHALL NOT shift horizontally based on the width of earlier row values

#### Scenario: Active schema mutation is guarded by backend response
- **WHEN** a schema update or delete request is rejected because the schema is active or otherwise conflicts with backend mutation rules
- **THEN** the system SHALL render the backend conflict as visible error feedback in the Schemas page context
- **AND** the system SHALL NOT remove the schema row or report a successful update

#### Scenario: Existing schema workflows remain available
- **WHEN** schema list layout and row actions are updated
- **THEN** the existing generate, validate, create, and activate workflows SHALL remain available from the same controller page

### Requirement: Schema activation and validation failures are visible
The system SHALL show explicit error feedback when schema activation requests fail and when schema JSON validation requests fail.

#### Scenario: Activation fails
- **WHEN** schema activation request fails
- **THEN** the system SHALL render a visible activation failure alert in the Schemas page context

#### Scenario: Validate YAML request fails
- **WHEN** schema validation endpoint request fails
- **THEN** the system SHALL render a visible validation failure alert in the schema validation workflow section

### Requirement: Schema retrieval and validation use standardized async state
The system SHALL run schema row detail retrieval and schema validation workflows through typed TanStack Query or mutation hooks and SHALL present pending, success, and error state from those hooks.

#### Scenario: Validate schema JSON
- **WHEN** a user submits schema JSON for validation
- **THEN** the system SHALL run the validation through an API-module mutation hook and render validation result or error state from that mutation

#### Scenario: Get schema details from row
- **WHEN** a user requests schema details from a schema row
- **THEN** the system SHALL run the retrieval through an API-module query or mutation hook using the row's schema ID
- **AND** the system SHALL render the latest successful result or error state from that hook
