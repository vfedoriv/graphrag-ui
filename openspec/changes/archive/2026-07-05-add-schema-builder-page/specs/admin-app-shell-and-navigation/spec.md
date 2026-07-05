## MODIFIED Requirements

### Requirement: Admin shell provides stable navigation and context
The system SHALL expose primary navigation entries by controller pages and schema-building workspace (Dashboard, Knowledge Bases, Schemas, Schema Builder, Documents, Queries, Settings), route each entry to its configured workspace, render the prototype-aligned brand/sidebar treatment, and provide shell-level action buttons with the shared interactive visual feedback states.

#### Scenario: Navigate by controller
- **WHEN** a user selects a controller from primary navigation
- **THEN** the system SHALL route to that controller's unified page with top context and the route's configured workflow structure

#### Scenario: Navigate to Schema Builder
- **WHEN** a user selects Schema Builder from primary navigation
- **THEN** the system SHALL route to the dedicated Schema Builder workspace
- **AND** the system SHALL preserve the current global knowledge-base selection

#### Scenario: Identify current route
- **WHEN** a user views a controller route or the Schema Builder route
- **THEN** the primary navigation SHALL visibly mark the active route using the prototype active navigation styling
