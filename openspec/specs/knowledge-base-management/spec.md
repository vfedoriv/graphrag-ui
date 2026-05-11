## ADDED Requirements

### Requirement: Users can manage knowledge bases
The system SHALL support listing, creating, renaming, deleting, and selecting knowledge bases using backend knowledge-base endpoints.

#### Scenario: Create and select a new knowledge base
- **WHEN** a user submits a valid knowledge base name in the create flow
- **THEN** the system SHALL create the knowledge base, refresh the list, and allow selecting it as active context

### Requirement: Mutations update visible state consistently
The system SHALL invalidate and refresh affected knowledge-base queries after successful create, update, or delete operations.

#### Scenario: Rename reflects in list and active context
- **WHEN** a user renames the currently selected knowledge base
- **THEN** the system SHALL update the displayed active context and list entry after mutation success
