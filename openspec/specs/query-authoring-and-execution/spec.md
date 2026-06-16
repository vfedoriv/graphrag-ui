## Purpose

This specification defines the required behavior for query authoring and execution in the GraphRAG admin UI.
## Requirements
### Requirement: Users can generate, validate, and execute Cypher
The system SHALL expose Cypher-related endpoint operations as tabs inside a single Queries controller page.

#### Scenario: Cypher workflows are tab-grouped
- **WHEN** a user opens the Queries page
- **THEN** the system SHALL display query context first and provide generate/validate/execute-related operations as tabs

### Requirement: Users can run one-shot ask workflow
The system SHALL keep one-shot ask as a dedicated tabbed workflow on the Queries page and return results in the same page context.

#### Scenario: Execute ask from tab
- **WHEN** a user submits an ask request from the Ask tab
- **THEN** the system SHALL execute the ask endpoint and display results without leaving the Queries page

### Requirement: Query workflow failures are visible to users
The system SHALL show explicit error feedback in the Queries controller for ask, generate, validate, and execute failures, and SHALL not rely on silent mutation failure behavior.

#### Scenario: Ask mutation fails
- **WHEN** ask endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Ask tab with actionable failure message

#### Scenario: Generate mutation fails
- **WHEN** generate endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Generate tab and keep existing inputs/results stable

### Requirement: Query parameter JSON areas are format-aware
The system SHALL treat query parameter fields as JSON-aware editors/previews with explicit JSON format indication and formatting support.

#### Scenario: Edit query parameter JSON
- **WHEN** a user edits JSON parameters for generate/validate/execute workflows
- **THEN** the UI SHALL provide JSON-aware presentation and allow formatting action for valid JSON input

### Requirement: Query parameter JSON must be valid before endpoint submission
The system SHALL prevent validate and execute query submissions when the query parameter JSON draft is invalid, instead of silently replacing invalid parameters with an empty object.

#### Scenario: Validate with invalid parameters JSON
- **WHEN** a user attempts to validate a Cypher query while the parameters JSON field contains invalid JSON
- **THEN** the system SHALL block the validation request and render the parameter format error

#### Scenario: Execute with invalid parameters JSON
- **WHEN** a user attempts to execute a Cypher query while the parameters JSON field contains invalid JSON
- **THEN** the system SHALL block the execution request and render the parameter format error

### Requirement: Query authoring draft state remains user-editable
The system SHALL keep prompt, Cypher, and parameter JSON values as client-owned drafts while using mutation hooks for backend generate, validate, execute, and ask request state.

#### Scenario: Generated query seeds editable draft
- **WHEN** query generation succeeds
- **THEN** the system SHALL populate editable Cypher and parameter draft fields from the response while allowing the user to modify them before validation or execution

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

### Requirement: Hybrid search failures are visible to users
The system SHALL show explicit error feedback in the Hybrid search workflow when the hybrid search request fails.

#### Scenario: Hybrid search mutation fails
- **WHEN** the hybrid search endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Hybrid search tab with the normalized failure message
- **AND** the system SHALL keep the user's hybrid search inputs stable

