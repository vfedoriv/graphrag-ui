## ADDED Requirements

### Requirement: Knowledge bases display active AI profile context
The system SHALL display each knowledge base's active AI profile assignment alongside existing knowledge base and active schema context.

#### Scenario: User views knowledge base table
- **WHEN** a user views the Knowledge Bases page
- **THEN** the system SHALL render the `activeAiProfileId` for each knowledge base when present
- **AND** the system SHALL render an explicit empty state when no active AI profile is assigned or available

#### Scenario: User views selected workspace context
- **WHEN** a knowledge base is selected in the app shell or controller page workspace context
- **THEN** the system SHALL include active AI profile context when it is available from backend data

### Requirement: Knowledge base active AI profile can be assigned
The system SHALL let users assign an existing AI profile to a knowledge base through `/api/v1/knowledge-bases/{knowledgeBaseId}/ai-profile`.

#### Scenario: User assigns profile to knowledge base
- **WHEN** a user selects an existing AI profile for a knowledge base and confirms the assignment
- **THEN** the system SHALL submit `{ profileId }` to the knowledge base active AI profile endpoint
- **AND** the system SHALL refresh knowledge base and active profile context after success

#### Scenario: Profile assignment fails
- **WHEN** the backend rejects a profile assignment because the profile is missing, incompatible, or invalid for the knowledge base
- **THEN** the system SHALL show visible error feedback in the Knowledge Bases page context
- **AND** the system SHALL keep the previous active AI profile visible

### Requirement: Active AI profile is surfaced for AI-backed workflows
The system SHALL show the selected knowledge base's active AI profile on pages that run AI-backed workflows.

#### Scenario: User opens schema generation workflow
- **WHEN** a user opens schema example or schema JSON generation for a selected knowledge base
- **THEN** the system SHALL show the active AI profile context used by generation requests

#### Scenario: User opens document processing workflow
- **WHEN** a user opens document processing for a selected knowledge base
- **THEN** the system SHALL show the active AI profile context used for embedding and graph extraction

#### Scenario: User opens query workflow
- **WHEN** a user opens query ask, Cypher generation, or hybrid search for a selected knowledge base
- **THEN** the system SHALL show the active AI profile context used by query-related AI calls
