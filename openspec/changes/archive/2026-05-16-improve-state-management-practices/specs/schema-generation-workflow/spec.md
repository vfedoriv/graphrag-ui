## ADDED Requirements

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
