## ADDED Requirements

### Requirement: Schemas page can hand schema content to the builder
The system SHALL allow users to open existing or generated schema content in the dedicated Schema Builder while preserving the existing Schemas page list, generation, validation, creation, update, delete, and activation workflows.

#### Scenario: Open listed schema in builder
- **WHEN** a user chooses a builder action for a schema row in the Schemas list
- **THEN** the system SHALL route to the Schema Builder with that schema selected for import
- **AND** the builder SHALL retrieve the schema details by schema id without requiring the user to copy the id manually

#### Scenario: Open generated schema JSON in builder
- **WHEN** a schema generation workflow has produced editable schema JSON content
- **THEN** the system SHALL provide a way to open that generated content in the Schema Builder as an unsaved draft
- **AND** the generated content SHALL remain available in the existing Schemas page workflow

#### Scenario: Existing schema workflows remain unchanged
- **WHEN** Schema Builder access is added to the Schemas page
- **THEN** the existing schema list, details, update, delete, activate, generate, validate, and create workflows SHALL remain available from the Schemas page
