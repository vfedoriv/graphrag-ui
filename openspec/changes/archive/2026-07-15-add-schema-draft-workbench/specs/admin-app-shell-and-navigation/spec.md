## ADDED Requirements

### Requirement: Primary navigation includes Schema Drafts
The system SHALL expose a `Schema Drafts` primary-navigation destination at `/schema-drafts` and SHALL lazy-load its route module inside the existing application shell.

#### Scenario: Navigate to Schema Drafts
- **WHEN** a user selects Schema Drafts from primary navigation
- **THEN** the application SHALL navigate to `/schema-drafts`
- **AND** SHALL preserve the globally selected knowledge base while the route module loads

#### Scenario: Open a draft deep link
- **WHEN** a user opens `/schema-drafts/{draftId}` with a matching selected knowledge base
- **THEN** the application SHALL render that draft's workbench after validating knowledge-base ownership through the API
