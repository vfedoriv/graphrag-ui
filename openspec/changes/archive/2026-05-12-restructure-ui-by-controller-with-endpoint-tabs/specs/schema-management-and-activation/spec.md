## MODIFIED Requirements

### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas in a top section and expose schema operations as tabs on the Schemas page, including create schema, get schema by ID, and validate schema YAML.

#### Scenario: Schemas page groups operations as endpoint tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display schema list/context first and expose create/get-by-id/validate operations as separate tabs on the same page

### Requirement: Users can activate a schema for a selected knowledge base
The system SHALL allow activating a selected schema against the currently selected knowledge base from within the Schemas controller page workflow area.

#### Scenario: Activate schema within tabbed Schemas page
- **WHEN** a user chooses a schema and confirms activation with an active knowledge base selected
- **THEN** the system SHALL call schema activation endpoint and refresh active-schema-related views without leaving the Schemas page
