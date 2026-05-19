## MODIFIED Requirements

### Requirement: Generated artifacts remain editable before final creation
The system SHALL keep generated JSON/example outputs editable inside their respective generation tab workflows before creating a schema, and generated schema JSON outputs SHALL be editable through the structured JSON editor.

#### Scenario: Edit generated YAML in active generation tab
- **WHEN** a user receives generated JSON or example output in a generation tab
- **THEN** the system SHALL allow editing output before submitting create/next-step actions

#### Scenario: Edit generated schema JSON as structured data
- **WHEN** a user receives generated schema JSON in a generation tab
- **THEN** the system SHALL render that generated schema JSON in the structured editor and allow node add, remove, move, and primitive-value edits before validation or creation

### Requirement: Generated schema outputs are separated from mutation cache state
The system SHALL allow successful schema generation responses to seed editable local draft output without treating the generated response object as the only source of truth for later user edits.

#### Scenario: User edits generated schema output
- **WHEN** a generation mutation succeeds and the user changes the generated output text
- **THEN** the edited draft SHALL remain available for validation or creation even though it differs from the original mutation response

#### Scenario: User edits generated schema output structurally
- **WHEN** a generation mutation succeeds and the user changes the generated schema JSON through the structured editor
- **THEN** the edited structured draft SHALL remain available for validation or creation even though it differs from the original mutation response
