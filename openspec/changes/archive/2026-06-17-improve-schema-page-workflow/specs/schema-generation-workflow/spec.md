## MODIFIED Requirements

### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as purpose-based workflow tabs under the Schemas page, text/file generation variants SHALL be selected through source-mode options inside the relevant generation tab, file-based generation controls SHALL use explicit file-select buttons and submit selected files to backend multipart generation endpoints, and schema generation/retrieval workflows SHALL provide visible output fields that display corresponding backend response content and non-blocking generation warnings when returned.

#### Scenario: Pick source file via explicit button in file-based generation mode
- **WHEN** a user selects file source mode in a schema generation tab
- **AND** clicks file-select in that file-based workflow and chooses a file
- **THEN** the system SHALL keep that selected file in workflow state and keep subsequent generation actions available without requiring client-side file text extraction

#### Scenario: Show generated schema YAML response in text generation mode
- **WHEN** a user runs `Generate schema JSON` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema JSON content in that mode's output field

#### Scenario: Show generated schema YAML response in file generation mode
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

#### Scenario: Edit generated YAML in active generation section
- **WHEN** a user receives generated JSON or example output in a generation section
- **THEN** the system SHALL allow editing output before submitting create/next-step actions

#### Scenario: Edit generated schema JSON as structured data
- **WHEN** a user receives generated schema JSON in a generation section
- **THEN** the system SHALL render that generated schema JSON in the structured editor and allow node add, remove, move, and primitive-value edits before validation or creation
