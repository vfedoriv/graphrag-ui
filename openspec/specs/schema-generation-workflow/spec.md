## Purpose

This specification defines the required behavior for schema generation workflow in the GraphRAG admin UI.
## Requirements
### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as purpose-based workflow tabs under the Schemas page, text/file generation variants SHALL be selected through source-mode options inside the relevant generation tab, file-based generation controls SHALL use explicit file-select buttons and submit selected files to backend multipart generation endpoints, and schema generation/retrieval workflows SHALL provide visible output fields that display corresponding backend response content and non-blocking generation warnings when returned.

#### Scenario: Pick source file via explicit button in file-based generation mode
- **WHEN** a user selects file source mode in a schema generation tab
- **AND** clicks file-select in that file-based workflow and chooses a file
- **THEN** the system SHALL keep that selected file in workflow state and keep subsequent generation actions available without requiring client-side file text extraction

#### Scenario: Show generated schema JSON response in text generation mode
- **WHEN** a user runs `Generate schema JSON` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema JSON content in that mode's output field

#### Scenario: Show generated schema JSON response in file generation mode
- **WHEN** a user runs `Generate schema JSON from file` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema JSON content in that mode's output field

#### Scenario: Replace stale output with latest response per mode
- **WHEN** a user executes the same generation mode action multiple times
- **THEN** the system SHALL replace that mode's output field content with the latest successful backend response

#### Scenario: Parse schema example success payload returned as direct string
- **WHEN** a user runs schema example generation from text or file and the backend returns a successful response body as a raw string containing the example array
- **THEN** the system SHALL treat that returned string as the generated example output and render it in the section output field

#### Scenario: Parse schema example success payload returned as wrapped object
- **WHEN** a user runs schema example generation from text or file and the backend returns a successful response object containing a string `example` field
- **THEN** the system SHALL use `example` as the generated example output and render it in the section output field

#### Scenario: Show schema generation warnings
- **WHEN** a user runs `Generate schema JSON` or `Generate schema JSON from file` and the backend returns advisory warnings with the generated schema content
- **THEN** the system SHALL display those warnings without preventing the generated schema content from being edited, validated, or used for schema creation

### Requirement: Generated artifacts remain editable before final creation
The system SHALL keep generated JSON/example outputs editable inside their respective generation workflow modes before creating a schema, and generated schema JSON outputs SHALL be editable through the structured JSON editor.

#### Scenario: Edit generated JSON in active generation section
- **WHEN** a user receives generated JSON or example output in a generation section
- **THEN** the system SHALL allow editing output before submitting create/next-step actions

#### Scenario: Edit generated schema JSON as structured data
- **WHEN** a user receives generated schema JSON in a generation section
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
