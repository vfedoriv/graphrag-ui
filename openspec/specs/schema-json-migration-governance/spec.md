# schema-json-migration-governance Specification

## Purpose
This specification defines JSON-only schema workflow behavior and unsupported schema format handling in the GraphRAG admin UI.
## Requirements
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

### Requirement: Current project guidance uses JSON-only schema wording
The system SHALL keep current project documentation and active OpenSpec specs aligned with JSON-only schema workflow behavior.

#### Scenario: Read schema workflow documentation
- **WHEN** a developer reads current README, agent instructions, or active OpenSpec specs
- **THEN** schema management, generation, validation, and editing workflows SHALL be described as JSON workflows
- **AND** current guidance SHALL NOT instruct users to validate, generate, or edit schema YAML

#### Scenario: Historical YAML decisions remain archived
- **WHEN** a developer inspects archived OpenSpec changes from before the JSON migration
- **THEN** historical YAML wording MAY remain in archived artifacts as implementation history
