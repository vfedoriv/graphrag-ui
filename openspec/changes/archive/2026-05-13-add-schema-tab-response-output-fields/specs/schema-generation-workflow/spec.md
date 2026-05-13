## MODIFIED Requirements

### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as dedicated tabs under the Schemas page, file-based generation tabs SHALL use explicit file-select buttons to load source input, and schema generation/retrieval tabs SHALL provide visible output text fields that display corresponding backend response content.

#### Scenario: Pick source file via explicit button in file-based generation tab
- **WHEN** a user clicks file-select in a file-based schema generation tab and chooses a file
- **THEN** the system SHALL load that file content into the generation workflow and keep subsequent generation actions available

#### Scenario: Show generated schema YAML response in direct generation tab
- **WHEN** a user runs `Generate schema YAML` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema YAML content in that tab's output text field

#### Scenario: Show generated schema YAML response in file-based generation tab
- **WHEN** a user runs `Generate schema YAML from file` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema YAML content in that tab's output text field

#### Scenario: Show schema retrieval response in get-by-id tab
- **WHEN** a user runs `Get schema by ID` and the backend returns a successful response
- **THEN** the system SHALL render the returned schema content in that tab's output text field

#### Scenario: Replace stale output with latest response per tab
- **WHEN** a user executes the same tab action multiple times
- **THEN** the system SHALL replace that tab's output text field content with the latest successful backend response
