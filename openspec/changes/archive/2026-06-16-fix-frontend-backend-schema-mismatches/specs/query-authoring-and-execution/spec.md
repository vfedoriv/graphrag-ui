## MODIFIED Requirements

### Requirement: Hybrid search results show evidence and graph context
The system SHALL render hybrid search response metadata, ranked chunk evidence, source metadata, optional chunk text, and graph context in the Queries controller page using the backend hybrid search DTO field names.

#### Scenario: Hybrid search returns hits
- **WHEN** the hybrid search endpoint returns ranked hits
- **THEN** the system SHALL display the applied query settings, hit count, execution time, chunk identifiers, document identifiers, chunk indexes, vector scores, and source metadata

#### Scenario: Chunk text is included
- **WHEN** the hybrid search response includes chunk text for a hit
- **THEN** the system SHALL display that chunk text with an explicit output label

#### Scenario: Graph context is included
- **WHEN** the hybrid search response includes graph entities or relationships for a hit under the backend `graph` field
- **THEN** the system SHALL display the entities with element identifiers, labels, and structured properties
- **AND** the system SHALL display the relationships with element identifiers, relationship type, `startNodeElementId`, `endNodeElementId`, and structured properties

#### Scenario: Hybrid search returns no hits
- **WHEN** the hybrid search endpoint returns an empty hit list
- **THEN** the system SHALL display an empty result state instead of a blank or failed workflow
