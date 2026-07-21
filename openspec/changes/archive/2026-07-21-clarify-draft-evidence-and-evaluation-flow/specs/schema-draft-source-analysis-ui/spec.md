## MODIFIED Requirements

### Requirement: Draft sources preserve their distinct ownership semantics
The system SHALL let users add existing knowledge-base documents, pasted text, and draft-owned files as distinct draft source types, SHALL show only backend-returned metadata after submission, and SHALL explain before submission that draft-owned files are discovery evidence which influence schema analysis, remain private to the draft, do not become normal knowledge-base documents, and cannot be used as held-out evaluation data.

#### Scenario: Add existing documents
- **WHEN** a user selects one or more documents owned by the current knowledge base
- **THEN** the system SHALL add each document source using the latest draft revision from the preceding successful request
- **AND** SHALL report per-document success or failure

#### Scenario: Add pasted text
- **WHEN** a user supplies a source name and non-empty pasted text
- **THEN** the system SHALL create a `TEXT` source
- **AND** SHALL not represent it as a normal uploaded document

#### Scenario: Explain a direct file before upload
- **WHEN** the draft-owned file form is displayed before a file is submitted
- **THEN** the system SHALL label the upload as discovery evidence
- **AND** SHALL warn that the file will influence the draft schema and cannot be used for held-out evaluation

#### Scenario: Add a direct file
- **WHEN** a user selects a source file
- **THEN** the system SHALL upload it to the draft file-source endpoint with the current revision
- **AND** SHALL not add it to the knowledge base document list
