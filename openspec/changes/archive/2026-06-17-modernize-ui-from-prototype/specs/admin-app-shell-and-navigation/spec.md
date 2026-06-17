## MODIFIED Requirements

### Requirement: Admin shell provides stable navigation and context
The system SHALL expose primary navigation entries by controller pages (Dashboard, Knowledge Bases, Schemas, Documents, Queries, Settings), route each entry to its single-page controller workspace, render the prototype-aligned brand/sidebar treatment, and provide shell-level action buttons with the shared interactive visual feedback states.

#### Scenario: Navigate by controller
- **WHEN** a user selects a controller from primary navigation
- **THEN** the system SHALL route to that controller's unified page with top context and the route's configured workflow structure

#### Scenario: Identify current route
- **WHEN** a user views a controller route
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
