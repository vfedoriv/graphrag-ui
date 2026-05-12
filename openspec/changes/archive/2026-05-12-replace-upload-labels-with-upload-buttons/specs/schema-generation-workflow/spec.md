## MODIFIED Requirements

### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as dedicated tabs under the Schemas page, and file-based generation tabs SHALL use explicit file-select buttons to load source input.

#### Scenario: Pick source file via explicit button in file-based generation tab
- **WHEN** a user clicks file-select in a file-based schema generation tab and chooses a file
- **THEN** the system SHALL load that file content into the generation workflow and keep subsequent generation actions available

### Requirement: Generated artifacts remain editable before final creation
The system SHALL keep generated YAML/example outputs editable inside their respective generation tab workflows before creating a schema.

#### Scenario: Edit generated YAML in active generation tab
- **WHEN** a user receives generated YAML or example output in a generation tab
- **THEN** the system SHALL allow editing output before submitting create/next-step actions
