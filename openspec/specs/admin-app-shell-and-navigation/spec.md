## Purpose

This specification defines the required behavior for admin app shell and navigation in the GraphRAG admin UI.
## Requirements
### Requirement: Admin shell provides stable navigation and context
The system SHALL expose primary navigation entries by controller pages (Schemas, Knowledge Bases, Documents, Queries) and route each entry to its single-page controller workspace, and shell-level action buttons SHALL use the shared interactive visual feedback states.

#### Scenario: Navigate by controller
- **WHEN** a user selects a controller from primary navigation
- **THEN** the system SHALL route to that controller's unified page with top context and endpoint tabs

### Requirement: Admin shell uses left-anchored responsive workspace layout
The system SHALL lay out the admin workspace so the primary navigation panel is aligned near the left side of the viewport with a fixed desktop width, and the main content region SHALL flex to use the remaining viewport width while preserving usable internal spacing and avoiding horizontal page overflow.

#### Scenario: Wide desktop viewport uses available width
- **WHEN** a user views any controller page on a wide desktop viewport
- **THEN** the primary navigation panel SHALL remain fixed-width and left-aligned
- **AND** the main content region SHALL expand into the available space to the right instead of keeping the entire shell centered with large side gutters

#### Scenario: Browser width changes
- **WHEN** the browser viewport is resized between common desktop widths
- **THEN** the primary navigation panel SHALL keep a stable width
- **AND** the main content region SHALL grow or shrink with the remaining viewport width

#### Scenario: Narrow viewport remains usable
- **WHEN** the browser viewport is too narrow for the desktop two-column shell
- **THEN** the layout SHALL remain usable without horizontal page overflow caused by the shell container

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
