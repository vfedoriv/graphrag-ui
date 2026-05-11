## ADDED Requirements

### Requirement: Admin shell provides stable navigation and context
The system SHALL render a persistent admin shell with sidebar navigation and a shared header that exposes selected knowledge base and backend status context across all feature routes, without calling a dedicated backend health endpoint.

#### Scenario: Navigate between primary sections
- **WHEN** a user selects a sidebar item for Dashboard, Knowledge Bases, Schemas, Documents, Queries, or Settings
- **THEN** the system SHALL route to the selected section and indicate the active section in navigation state

#### Scenario: Status context avoids dedicated health endpoint
- **WHEN** the header displays backend availability or status indicators
- **THEN** the system SHALL derive those indicators from existing feature API request outcomes rather than invoking a separate health endpoint

### Requirement: Knowledge base selection is globally available
The system SHALL persist the currently selected knowledge base and expose it to all routes that require knowledge-base-scoped operations.

#### Scenario: Restore selection after reload
- **WHEN** a user has previously selected a knowledge base and reloads the page
- **THEN** the system SHALL restore the selection from persisted client storage if the knowledge base still exists
