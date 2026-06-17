## ADDED Requirements

### Requirement: UI uses prototype-derived visual tokens
The system SHALL define and apply shared visual tokens derived from `new_ui_example/styles.css` for app background, surfaces, foreground text, muted text, borders, accent color, success/warning/danger states, font stacks, radii, spacing, and output typography.

#### Scenario: Render production admin UI with prototype tokens
- **WHEN** a user opens any production admin route
- **THEN** the route SHALL use the shared prototype-derived visual tokens instead of route-specific ad hoc colors or framework-default typography

#### Scenario: Render code and structured output
- **WHEN** a page displays request output, JSON, Cypher, identifiers, or code-like content
- **THEN** the content SHALL use the shared monospace typography and output surface treatment derived from the prototype

### Requirement: UI uses prototype panel and control primitives
The system SHALL provide reusable production primitives matching the prototype's panels, page headers, status pills, table wrappers, tabs, form grids, file pickers, notice blocks, action grids, and operation spines.

#### Scenario: Render controller workflow section
- **WHEN** a controller page displays a workflow section
- **THEN** the section SHALL use the shared prototype-aligned panel, heading, spacing, control, and status treatments

#### Scenario: Render tabbed workflow section
- **WHEN** a controller workflow uses tabs
- **THEN** tab controls SHALL use the prototype pill tab styling with visible active, hover, focus, disabled, and responsive wrapping behavior

#### Scenario: Render data table
- **WHEN** a controller page displays tabular backend data
- **THEN** the table SHALL be wrapped in a scrollable bordered table container and preserve readable headers, row status, row actions, and no page-level horizontal overflow

### Requirement: UI preserves prototype responsive behavior
The system SHALL adapt the app shell, panels, grids, tables, tabs, toolbars, and forms across the prototype viewport matrix without horizontal page overflow.

#### Scenario: Render mobile viewport
- **WHEN** a user views the app at 360px, 390px, or 430px wide
- **THEN** the shell SHALL collapse to a single-column layout
- **AND** grids, forms, panel headers, and action rows SHALL remain usable without horizontal page overflow

#### Scenario: Render tablet viewport
- **WHEN** a user views the app at 600px, 820px, or 1024px wide
- **THEN** route content SHALL preserve readable spacing and avoid clipping labels, controls, tables, editors, and output blocks

#### Scenario: Render desktop viewport
- **WHEN** a user views the app at 1366px, 1440px, or 1920px wide
- **THEN** the shell SHALL preserve the prototype's fixed-width left navigation and allow the main workspace to use the remaining width

### Requirement: UI replaces prototype sample content with real app state
The system SHALL use the prototype's copy and sample data only as visual guidance, replacing sample workspaces, rows, counts, statuses, and outputs with live API-backed data or existing functional state where available.

#### Scenario: Render selected workspace context
- **WHEN** a selected knowledge base exists in production state
- **THEN** workspace context labels, selector values, controller defaults, and action scopes SHALL reflect the selected knowledge base rather than static prototype workspace values

#### Scenario: Render missing backend data
- **WHEN** a prototype value has no live equivalent in the current frontend API data
- **THEN** the UI SHALL render a neutral loading, empty, unavailable, or derived state instead of displaying misleading sample data
