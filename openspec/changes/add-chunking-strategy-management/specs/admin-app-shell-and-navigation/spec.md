## MODIFIED Requirements

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
