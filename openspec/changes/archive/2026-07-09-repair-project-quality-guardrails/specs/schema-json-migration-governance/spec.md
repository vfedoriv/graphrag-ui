## ADDED Requirements

### Requirement: Current project guidance uses JSON-only schema wording
The system SHALL keep current project documentation and active OpenSpec specs aligned with JSON-only schema workflow behavior.

#### Scenario: Read schema workflow documentation
- **WHEN** a developer reads current README, agent instructions, or active OpenSpec specs
- **THEN** schema management, generation, validation, and editing workflows SHALL be described as JSON workflows
- **AND** current guidance SHALL NOT instruct users to validate, generate, or edit schema YAML

#### Scenario: Historical YAML decisions remain archived
- **WHEN** a developer inspects archived OpenSpec changes from before the JSON migration
- **THEN** historical YAML wording MAY remain in archived artifacts as implementation history
