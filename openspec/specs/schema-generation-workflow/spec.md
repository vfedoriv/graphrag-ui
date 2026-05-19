## Purpose

This specification defines the required behavior for schema generation workflow in the GraphRAG admin UI.
## Requirements
### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as dedicated tabs under the Schemas page, file-based generation tabs SHALL use explicit file-select buttons and submit selected files to backend multipart generation endpoints, and schema generation/retrieval tabs SHALL provide visible output text fields that display corresponding backend response content.

#### Scenario: Pick source file via explicit button in file-based generation tab
- **WHEN** a user clicks file-select in a file-based schema generation tab and chooses a file
- **THEN** the system SHALL keep that selected file in workflow state and keep subsequent generation actions available without requiring client-side file text extraction

#### Scenario: Show generated schema YAML response in direct generation tab
- **WHEN** a user runs `Generate schema JSON` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema JSON content in that tab's output text field

#### Scenario: Show generated schema YAML response in file-based generation tab
- **WHEN** a user runs `Generate schema JSON from file` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema JSON content in that tab's output text field

#### Scenario: Show schema retrieval response in get-by-id tab
- **WHEN** a user runs `Get schema by ID` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema content in that tab's output text field

#### Scenario: Replace stale output with latest response per tab
- **WHEN** a user executes the same tab action multiple times
- **THEN** the system SHALL replace that tab's output text field content with the latest successful backend response

### Requirement: Generated artifacts remain editable before final creation
The system SHALL keep generated JSON/example outputs editable inside their respective generation tab workflows before creating a schema, and generated schema JSON outputs SHALL be editable through the structured JSON editor.

#### Scenario: Edit generated YAML in active generation tab
- **WHEN** a user receives generated JSON or example output in a generation tab
- **THEN** the system SHALL allow editing output before submitting create/next-step actions

#### Scenario: Edit generated schema JSON as structured data
- **WHEN** a user receives generated schema JSON in a generation tab
- **THEN** the system SHALL render that generated schema JSON in the structured editor and allow node add, remove, move, and primitive-value edits before validation or creation

### Requirement: Schema generation requests use mutation hooks
The system SHALL run schema example generation, file-based example generation, schema JSON generation, and file-based schema JSON generation through typed TanStack Query mutation hooks.

#### Scenario: Generate schema example from text
- **WHEN** a user submits source text for schema example generation
- **THEN** the system SHALL expose pending, success, and error state through the generation mutation hook and render those states in the tab

#### Scenario: Generate schema JSON from file
- **WHEN** a user submits a selected file for schema JSON generation
- **THEN** the system SHALL expose pending, success, and error state through the file-generation mutation hook and render those states in the tab

### Requirement: Generated schema outputs are separated from mutation cache state
The system SHALL allow successful schema generation responses to seed editable local draft output without treating the generated response object as the only source of truth for later user edits.

#### Scenario: User edits generated schema output
- **WHEN** a generation mutation succeeds and the user changes the generated output text
- **THEN** the edited draft SHALL remain available for validation or creation even though it differs from the original mutation response

#### Scenario: User edits generated schema output structurally
- **WHEN** a generation mutation succeeds and the user changes the generated schema JSON through the structured editor
- **THEN** the edited structured draft SHALL remain available for validation or creation even though it differs from the original mutation response

