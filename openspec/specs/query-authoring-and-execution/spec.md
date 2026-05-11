## ADDED Requirements

### Requirement: Users can generate, validate, and execute Cypher
The system SHALL support prompt-based Cypher generation, manual Cypher editing, validation, and execution against selected knowledge base context.

#### Scenario: Execute validated query
- **WHEN** a user validates Cypher successfully and runs execution
- **THEN** the system SHALL execute query and render returned tabular results including rows and columns

### Requirement: Users can run one-shot ask workflow
The system SHALL support one-shot natural-language ask flow that returns generated query context and answer payload from backend ask endpoint.

#### Scenario: Ask question with active knowledge base
- **WHEN** a user submits a natural-language question with an active knowledge base selected
- **THEN** the system SHALL call ask endpoint and display resulting answer data and related query metadata
