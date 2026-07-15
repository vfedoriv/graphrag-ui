## ADDED Requirements

### Requirement: Published schemas can be activated from the draft release workflow
The system SHALL allow a user to activate the published inactive schema from its draft release context by calling the existing knowledge-base schema activation endpoint and refreshing all active-schema-related caches.

#### Scenario: Activate the published schema
- **WHEN** a published draft references an inactive schema and the user confirms activation
- **THEN** the system SHALL call the existing activation endpoint with the selected knowledge base and published schema ID
- **AND** SHALL refresh knowledge-base, schema-list, publication, and release-stage state

#### Scenario: Published schema is already active
- **WHEN** active-schema state matches the published schema ID
- **THEN** the system SHALL render a non-actionable active state and make the separate reprocessing stage available

#### Scenario: Activation fails
- **WHEN** the backend rejects activation
- **THEN** the system SHALL retain the published inactive state and show normalized activation failure feedback
