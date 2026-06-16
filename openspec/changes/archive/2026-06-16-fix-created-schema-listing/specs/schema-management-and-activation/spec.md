## MODIFIED Requirements

### Requirement: Users can inspect and create schemas
The system SHALL support listing schemas related to the currently selected knowledge base in a top section and expose schema operations as tabs on the Schemas page, including create schema, get schema by ID, and validate schema JSON. After a successful schema creation launched from the Schemas page with an active knowledge base selected, the system SHALL refresh the selected knowledge base's schema list and render the newly listed backend result when that scoped list includes the created schema.

#### Scenario: Schemas page groups operations as endpoint tabs
- **WHEN** a user opens the Schemas page
- **THEN** the system SHALL display knowledge-base-scoped schema list/context first and expose create/get-by-id/validate operations as separate tabs on the same page

#### Scenario: Selected knowledge base has no related schemas
- **WHEN** a user has an active knowledge base selected and that knowledge base has no associated schemas
- **THEN** the system SHALL show an empty-state message indicating there are no schemas for the selected knowledge base

#### Scenario: Created schema appears in selected knowledge base list
- **WHEN** a user creates a schema while a knowledge base is selected
- **AND** the backend's knowledge-base-scoped schema list includes the created schema after creation
- **THEN** the system SHALL refresh that selected knowledge base's schema list
- **AND** the system SHALL render the created schema in the Schemas page list without requiring a manual retry

#### Scenario: Duplicate schema creation remains an error
- **WHEN** schema creation is rejected because the immutable schema name and version already exist
- **THEN** the system SHALL render the backend conflict as visible create failure feedback
- **AND** the system SHALL NOT report a successful creation
