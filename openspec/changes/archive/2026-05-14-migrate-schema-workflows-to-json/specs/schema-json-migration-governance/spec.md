## ADDED Requirements

### Requirement: Schema workflows are JSON-only
The system SHALL enforce JSON as the only supported schema format across schema management and generation workflows.

#### Scenario: User enters schema content
- **WHEN** a user interacts with create, validate, or generate schema workflows
- **THEN** the system SHALL present schema content as JSON and SHALL NOT require or suggest YAML input

### Requirement: Unsupported schema formats are visibly handled
The system SHALL treat schema format values outside `JSON` as unsupported data that requires user-visible handling.

#### Scenario: Backend returns non-JSON schema format
- **WHEN** the schema API returns a format value other than `JSON`
- **THEN** the UI SHALL show an explicit unsupported-format state and SHALL NOT silently coerce the value to `JSON`
