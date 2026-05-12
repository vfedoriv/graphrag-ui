## MODIFIED Requirements

### Requirement: Schema generation follows staged workflow
The system SHALL expose schema generation actions as dedicated tabs under the Schemas page, including generate schema YAML (text), generate schema YAML from file, generate schema example from text, and generate schema example from file.

#### Scenario: Access generation workflows from Schemas tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL provide separate generation tabs for each generation endpoint workflow

### Requirement: Generated artifacts remain editable before final creation
The system SHALL keep generated YAML/example outputs editable inside their respective generation tab workflows before creating a schema.

#### Scenario: Edit generated YAML in active generation tab
- **WHEN** a user receives generated YAML or example output in a generation tab
- **THEN** the system SHALL allow editing output before submitting create/next-step actions
