## Purpose

This specification defines the required behavior for admin app shell and navigation in the GraphRAG admin UI.
## Requirements
### Requirement: Admin shell provides stable navigation and context
The system SHALL expose primary navigation entries by controller pages and dedicated workspaces (Dashboard, Knowledge Bases, Schemas, Schema Builder, Schema Drafts, Documents, Chunking, Queries, AI Providers, Settings), route each entry to its configured workspace, render the prototype-aligned brand/sidebar treatment, and provide shell-level action buttons with the shared interactive visual feedback states.

#### Scenario: Navigate by controller
- **WHEN** a user selects a controller or workspace from primary navigation
- **THEN** the system SHALL route to its unified page with top context and configured workflow structure

#### Scenario: Navigate to Schema Builder
- **WHEN** a user selects Schema Builder from primary navigation
- **THEN** the system SHALL route to the dedicated Schema Builder workspace
- **AND** SHALL preserve the current global knowledge-base selection

#### Scenario: Navigate to Chunking
- **WHEN** a user selects Chunking from primary navigation
- **THEN** the system SHALL lazy-load `/chunking`
- **AND** SHALL place Chunking immediately after Documents and before Queries

#### Scenario: Identify current route
- **WHEN** a user views a controller or dedicated workspace route
- **THEN** the primary navigation SHALL visibly mark the active route using the prototype active navigation styling

### Requirement: Admin shell uses left-anchored responsive workspace layout
The system SHALL lay out the admin workspace using the prototype's left-anchored shell: a fixed-width desktop navigation panel near 260px, a main content region that flexes to the remaining viewport width, prototype-aligned workspace padding, and a single-column layout below the tablet breakpoint while avoiding horizontal page overflow.

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
- **THEN** the navigation SHALL stack above the workspace
- **AND** the layout SHALL remain usable without horizontal page overflow caused by the shell container

### Requirement: Knowledge base selection is globally available
The system SHALL preserve global knowledge base selection behavior across controller pages and their workflows, and SHALL present that selected knowledge-base context using the prototype workspace selector, metadata, and status-strip visual pattern.

#### Scenario: Use global knowledge base in controller tabs
- **WHEN** a user has an active global knowledge base selected and runs an endpoint workflow from a controller tab
- **THEN** the workflow SHALL consume the selected knowledge base context consistently

#### Scenario: Show selected knowledge base in shell context
- **WHEN** a user views any controller route after knowledge-base data has loaded
- **THEN** the shell SHALL show the selected knowledge base name or identifier in the prototype-aligned workspace selector/context area

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

### Requirement: Admin shell exposes appearance selection
The system SHALL provide a labeled appearance control in the shared admin shell that offers light, system, and dark options on every application route.

#### Scenario: Change appearance from a controller route
- **WHEN** a user selects an appearance option from the shell on any controller route
- **THEN** the system SHALL apply that preference without navigating away or resetting the selected knowledge-base context

#### Scenario: Operate appearance control with a keyboard
- **WHEN** a keyboard user focuses and operates the shell appearance control
- **THEN** all appearance options SHALL be reachable and selectable
- **AND** focus and selected states SHALL be visibly and programmatically identifiable

#### Scenario: Use appearance control on a narrow viewport
- **WHEN** a user views the stacked shell on a narrow viewport
- **THEN** the appearance control SHALL remain visible and usable without causing horizontal page overflow

### Requirement: Primary navigation includes Schema Drafts
The system SHALL expose a `Schema Drafts` primary-navigation destination at `/schema-drafts` and SHALL lazy-load its route module inside the existing application shell.

#### Scenario: Navigate to Schema Drafts
- **WHEN** a user selects Schema Drafts from primary navigation
- **THEN** the application SHALL navigate to `/schema-drafts`
- **AND** SHALL preserve the globally selected knowledge base while the route module loads

#### Scenario: Open a draft deep link
- **WHEN** a user opens `/schema-drafts/{draftId}` with a matching selected knowledge base
- **THEN** the application SHALL render that draft's workbench after validating knowledge-base ownership through the API
