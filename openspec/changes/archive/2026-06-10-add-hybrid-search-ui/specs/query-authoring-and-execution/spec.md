## ADDED Requirements

### Requirement: Users can run hybrid search
The system SHALL expose a hybrid search workflow on the Queries controller page that submits natural-language search text and bounded retrieval options for the selected knowledge base.

#### Scenario: Submit hybrid search
- **WHEN** a user enters hybrid search text and submits the Hybrid search workflow
- **THEN** the system SHALL call the selected knowledge base's hybrid search endpoint with the search text, hit limit, graph expansion depth, and chunk text inclusion setting
- **AND** the system SHALL display the returned hybrid search results without leaving the Queries page

#### Scenario: Hybrid search uses selected knowledge base
- **WHEN** a user submits hybrid search while a knowledge base is selected
- **THEN** the system SHALL scope the request to that selected knowledge base id

#### Scenario: Hybrid search options are bounded before submission
- **WHEN** a user configures hybrid search options
- **THEN** the system SHALL prevent submitting a hit limit below 1 or a graph expansion depth below 0

### Requirement: Hybrid search results show evidence and graph context
The system SHALL render hybrid search response metadata, ranked chunk evidence, source metadata, optional chunk text, and graph context in the Queries controller page.

#### Scenario: Hybrid search returns hits
- **WHEN** the hybrid search endpoint returns ranked hits
- **THEN** the system SHALL display the applied query settings, hit count, execution time, chunk identifiers, document identifiers, chunk indexes, vector scores, and source metadata

#### Scenario: Chunk text is included
- **WHEN** the hybrid search response includes chunk text for a hit
- **THEN** the system SHALL display that chunk text with an explicit output label

#### Scenario: Graph context is included
- **WHEN** the hybrid search response includes graph entities or relationships for a hit
- **THEN** the system SHALL display the entities and relationships with labels, identifiers, types or labels, and structured properties

#### Scenario: Hybrid search returns no hits
- **WHEN** the hybrid search endpoint returns an empty hit list
- **THEN** the system SHALL display an empty result state instead of a blank or failed workflow

### Requirement: Hybrid search failures are visible to users
The system SHALL show explicit error feedback in the Hybrid search workflow when the hybrid search request fails.

#### Scenario: Hybrid search mutation fails
- **WHEN** the hybrid search endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Hybrid search tab with the normalized failure message
- **AND** the system SHALL keep the user's hybrid search inputs stable
