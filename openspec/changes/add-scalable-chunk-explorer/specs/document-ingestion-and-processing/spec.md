## MODIFIED Requirements

### Requirement: Users can inspect document processing outputs
The system SHALL allow users to inspect document processing status and options within the Documents page through direct actions, and SHALL hand chunk inspection to the dedicated scalable Chunking explorer without downloading the complete chunk list on Documents.

#### Scenario: View processing outputs after execution
- **WHEN** a document processing workflow completes
- **THEN** the system SHALL show resulting status and applicable processing output context in the Documents page

#### Scenario: Inspect chunks for a selected document
- **WHEN** a user requests chunk inspection for a document
- **THEN** the system SHALL navigate to `/chunking?view=chunks&documentId={documentId}`
- **AND** SHALL preserve the globally selected knowledge base

#### Scenario: Documents does not materialize chunks
- **WHEN** the Documents page lists or manages documents
- **THEN** it SHALL NOT request the compatibility complete-list chunk route for inline rendering

### Requirement: Document workflow failures are surfaced for process and handoff
The system SHALL show explicit error feedback for document processing failures and SHALL keep chunk-inspection handoff available only for an owned document row.

#### Scenario: Process request fails
- **WHEN** document process request fails
- **THEN** the system SHALL render a visible process failure alert near document actions

#### Scenario: Chunk inspection handoff is selected
- **WHEN** a user activates `Inspect chunking` for an owned document
- **THEN** the system SHALL navigate with that document ID rather than loading chunks within Documents
