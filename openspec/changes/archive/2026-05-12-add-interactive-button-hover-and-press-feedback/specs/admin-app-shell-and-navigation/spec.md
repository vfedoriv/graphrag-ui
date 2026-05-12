## MODIFIED Requirements

### Requirement: Admin shell provides stable navigation and context
The system SHALL expose primary navigation entries by controller pages (Schemas, Knowledge Bases, Documents, Queries) and route each entry to its single-page controller workspace, and shell-level action buttons SHALL use the shared interactive visual feedback states.

#### Scenario: Navigate by controller
- **WHEN** a user selects a controller from primary navigation
- **THEN** the system SHALL route to that controller's unified page with top context and endpoint tabs

### Requirement: Knowledge base selection is globally available
The system SHALL preserve global knowledge base selection behavior across controller pages and their tabbed endpoint workflows.

#### Scenario: Use global knowledge base in controller tabs
- **WHEN** a user has an active global knowledge base selected and runs an endpoint workflow from a controller tab
- **THEN** the workflow SHALL consume the selected knowledge base context consistently
