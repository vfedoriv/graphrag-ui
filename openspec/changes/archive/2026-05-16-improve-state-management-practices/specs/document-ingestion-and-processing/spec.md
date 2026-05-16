## ADDED Requirements

### Requirement: Document queries use nullable-safe query keys
The system SHALL use explicit query-key factories for document list and document chunk queries, including disabled states when the required knowledge-base or document id is missing.

#### Scenario: No knowledge base selected for documents list
- **WHEN** the Documents page renders without a selected knowledge base
- **THEN** the documents query SHALL use a stable disabled key and SHALL NOT invoke the documents list endpoint

#### Scenario: No document selected for chunks
- **WHEN** no document is selected for chunk inspection
- **THEN** the chunks query SHALL use a stable disabled key and SHALL NOT invoke the chunks endpoint

### Requirement: Row-specific document processing state remains client-owned
The system SHALL keep row-specific process pending indicators scoped to the document rows that initiated processing while still using mutation state for backend request lifecycle and errors.

#### Scenario: Process one document row
- **WHEN** a user starts processing one document
- **THEN** only that document row SHALL show row-specific pending feedback and the global mutation error state SHALL remain available for process failures
