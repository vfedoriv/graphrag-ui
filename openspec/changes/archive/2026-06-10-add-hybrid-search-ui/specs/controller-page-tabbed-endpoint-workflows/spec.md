## ADDED Requirements

### Requirement: Queries controller includes hybrid search endpoint tab
The system SHALL expose hybrid search as a dedicated endpoint workflow tab on the Queries controller page.

#### Scenario: Queries tabs include hybrid search
- **WHEN** a user opens the Queries controller page with a selected knowledge base
- **THEN** the tab list SHALL include a Hybrid search tab alongside the existing Ask query, Generate Cypher, Validate Cypher, and Execute Cypher tabs

#### Scenario: Hybrid search request is in flight
- **WHEN** a hybrid search request has not completed
- **THEN** the Queries controller page SHALL show the same in-context request progress treatment used by other query endpoint workflows
- **AND** endpoint tab switching SHALL be disabled while the request is pending

#### Scenario: Existing query endpoint tabs remain available
- **WHEN** the Hybrid search tab is added
- **THEN** the existing Ask query, Generate Cypher, Validate Cypher, and Execute Cypher endpoint tabs SHALL remain available from the Queries controller page
