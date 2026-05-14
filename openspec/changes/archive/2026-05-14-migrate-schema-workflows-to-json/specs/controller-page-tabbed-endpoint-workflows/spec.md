## MODIFIED Requirements

### Requirement: Endpoint tabs map one-to-one with endpoint workflows
The system SHALL provide one tab per endpoint workflow only for controller pages that enable tabbed workflows, and each workflow panel SHALL use explicit labels for standalone inputs and text outputs. Controller pages that disable endpoint tabs SHALL keep workflow actions directly accessible inline without placeholder tab UI. For the Schemas controller page, the tab sequence SHALL be fixed to: Generate schema example from text, Generate schema example from file, Generate schema JSON, Generate schema JSON from file, Validate schema JSON, Create schema, Get schema by ID.

#### Scenario: Controller page without tabbed workflows
- **WHEN** a controller page does not enable endpoint tabs
- **THEN** the system SHALL not render empty or placeholder tabs and SHALL keep workflow actions directly accessible

#### Scenario: Schemas tab order follows workflow sequence
- **WHEN** a user opens the Schemas controller page
- **THEN** the tab buttons SHALL be displayed in this exact order: Generate schema example from text, Generate schema example from file, Generate schema JSON, Generate schema JSON from file, Validate schema JSON, Create schema, Get schema by ID
