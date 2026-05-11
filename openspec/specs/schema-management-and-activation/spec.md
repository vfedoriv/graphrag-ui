## ADDED Requirements

### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas, viewing schema metadata/detail, validating schema YAML, and creating schema entries from YAML payloads.

#### Scenario: Validate schema before creation
- **WHEN** a user submits schema YAML to validation
- **THEN** the system SHALL display validation success or backend-reported validation errors before create submission

### Requirement: Users can activate a schema for a selected knowledge base
The system SHALL allow activating a selected schema against the currently selected knowledge base.

#### Scenario: Activate schema with selected knowledge base
- **WHEN** a user chooses a schema and confirms activation with an active knowledge base selected
- **THEN** the system SHALL call schema activation endpoint and refresh active-schema-related views
