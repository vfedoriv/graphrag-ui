## MODIFIED Requirements

### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas related to the currently selected knowledge base in a top section and expose schema operations as tabs on the Schemas page, including create schema, get schema by ID, and validate schema JSON.

#### Scenario: Schemas page groups operations as endpoint tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display knowledge-base-scoped schema list/context first and expose create/get-by-id/validate operations as separate tabs on the same page

#### Scenario: Selected knowledge base has no related schemas
- **WHEN** a user has an active knowledge base selected and that knowledge base has no associated schemas
- **THEN** the system SHALL show an empty-state message indicating there are no schemas for the selected knowledge base
