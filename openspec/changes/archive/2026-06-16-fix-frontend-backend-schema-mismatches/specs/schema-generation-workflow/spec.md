## MODIFIED Requirements

### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as dedicated tabs under the Schemas page, file-based generation tabs SHALL use explicit file-select buttons and submit selected files to backend multipart generation endpoints, and schema generation/retrieval tabs SHALL provide visible output text fields that display corresponding backend response content and non-blocking generation warnings when returned.

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

#### Scenario: Parse schema example success payload returned as direct string
- **WHEN** a user runs schema example generation from text or file and the backend returns a successful response body as a raw string containing the example array
- **THEN** the system SHALL treat that returned string as the generated example output and render it in the tab output field

#### Scenario: Parse schema example success payload returned as wrapped object
- **WHEN** a user runs schema example generation from text or file and the backend returns a successful response object containing a string `example` field
- **THEN** the system SHALL use `example` as the generated example output and render it in the tab output field

#### Scenario: Show schema generation warnings
- **WHEN** a user runs `Generate schema JSON` or `Generate schema JSON from file` and the backend returns advisory warnings with the generated schema content
- **THEN** the system SHALL display those warnings without preventing the generated schema content from being edited, validated, or used for schema creation
