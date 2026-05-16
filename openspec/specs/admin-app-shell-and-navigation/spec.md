## Purpose

This specification defines the required behavior for admin app shell and navigation in the GraphRAG admin UI.
## Requirements
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

### Requirement: Long-running backend activity is globally understandable
The system SHALL provide a consistent pending-state language across controller pages so users understand that backend work is active and the UI is awaiting results.

#### Scenario: User navigates while request is pending
- **WHEN** a request-triggering action is pending in the current controller view
- **THEN** visible pending feedback SHALL remain clear enough that users understand why final results are not yet available

### Requirement: Persisted knowledge base selection is reconciled with server data
The system SHALL reconcile the persisted selected knowledge-base id against the server-backed knowledge-base list after the list has loaded successfully.

#### Scenario: Persisted selected knowledge base no longer exists
- **WHEN** the knowledge-base list loads successfully and does not contain the persisted selected knowledge-base id
- **THEN** the system SHALL clear the selected knowledge-base id and update persisted selection storage accordingly

#### Scenario: Persisted selected knowledge base still exists
- **WHEN** the knowledge-base list loads successfully and contains the persisted selected knowledge-base id
- **THEN** the system SHALL keep that knowledge base selected

#### Scenario: Knowledge-base list has not loaded
- **WHEN** the knowledge-base list is still loading or failed to load
- **THEN** the system SHALL NOT clear the persisted selected knowledge-base id based only on missing query data

