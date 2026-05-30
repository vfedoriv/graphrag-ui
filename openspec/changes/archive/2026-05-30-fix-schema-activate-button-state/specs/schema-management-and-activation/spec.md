## MODIFIED Requirements

### Requirement: Users can activate a schema for a selected knowledge base
The system SHALL allow activating a selected schema against the currently selected knowledge base from within the Schemas controller page workflow area, and SHALL render row activation controls according to each schema status.

#### Scenario: Activate schema within tabbed Schemas page
- **WHEN** a user chooses an inactive schema and confirms activation with an active knowledge base selected
- **THEN** the system SHALL call schema activation endpoint and refresh active-schema-related views without leaving the Schemas page

#### Scenario: Active schema row does not expose actionable activation
- **WHEN** a schema row is reported with `ACTIVE` status in the schema list
- **THEN** the row action SHALL show an active-state caption and SHALL be non-interactive
