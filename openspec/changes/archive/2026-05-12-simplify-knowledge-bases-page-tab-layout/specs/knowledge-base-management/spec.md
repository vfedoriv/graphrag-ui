## MODIFIED Requirements

### Requirement: Users can manage knowledge bases
The system SHALL provide knowledge base management from a single Knowledge Bases controller page with an inline create section and table-based actions for update/delete/select.

#### Scenario: Create knowledge base from inline section
- **WHEN** a user opens the Knowledge Bases page
- **THEN** the system SHALL show the create form directly on the page without requiring a tab switch

### Requirement: Mutations update visible state consistently
The system SHALL refresh list and detail views in-place after knowledge base mutations performed from page actions.

#### Scenario: Mutation updates top list section
- **WHEN** a user completes a knowledge base mutation from inline form or row actions
- **THEN** the system SHALL update the visible knowledge base list/context to reflect backend state changes
