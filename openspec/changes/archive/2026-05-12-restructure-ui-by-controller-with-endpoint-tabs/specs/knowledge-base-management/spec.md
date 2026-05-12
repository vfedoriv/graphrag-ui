## MODIFIED Requirements

### Requirement: Users can manage knowledge bases
The system SHALL provide knowledge base management from a single Knowledge Bases controller page with endpoint-specific tabs for create/read/update/delete and related operations.

#### Scenario: Knowledge base operations are tab-grouped
- **WHEN** a user opens the Knowledge Bases page
- **THEN** the system SHALL show the knowledge base list/context first and expose endpoint operations as tabs on the same page

### Requirement: Mutations update visible state consistently
The system SHALL refresh list and detail views in-place after knowledge base mutations performed from endpoint tabs.

#### Scenario: Mutation updates top list section
- **WHEN** a user completes a knowledge base mutation from a tab
- **THEN** the system SHALL update the top knowledge base list/context section to reflect backend state changes
