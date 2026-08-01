## MODIFIED Requirements

### Requirement: Admin shell provides stable navigation and context
The system SHALL expose primary navigation entries by controller pages and dedicated workspaces (Dashboard, Knowledge Bases, Schemas, Schema Builder, Schema Drafts, Documents, Chunking, Advanced Search, Queries, AI Providers, Settings), route each entry to its configured workspace, render the prototype-aligned brand/sidebar treatment, and provide shell-level action buttons with the shared interactive visual feedback states.

#### Scenario: Navigate by controller
- **WHEN** a user selects a controller or workspace from primary navigation
- **THEN** the system SHALL route to its unified page with top context and configured workflow structure

#### Scenario: Navigate to Schema Builder
- **WHEN** a user selects Schema Builder from primary navigation
- **THEN** the system SHALL route to the dedicated Schema Builder workspace
- **AND** SHALL preserve the current global knowledge-base selection

#### Scenario: Navigate to operational workspaces
- **WHEN** a user views the primary navigation
- **THEN** Documents, Chunking, Advanced Search, and Queries SHALL appear in that order
- **AND** `/advanced-search` SHALL lazy-load its dedicated workspace

#### Scenario: Identify current route
- **WHEN** a user views a controller or dedicated workspace route
- **THEN** the primary navigation SHALL visibly mark the active route using the prototype active navigation styling
