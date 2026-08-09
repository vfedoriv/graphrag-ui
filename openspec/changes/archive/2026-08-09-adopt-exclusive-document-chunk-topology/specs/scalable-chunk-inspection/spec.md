## MODIFIED Requirements

### Requirement: Chunk Explorer uses only bounded collection reads
The system SHALL provide a Chunk Explorer at `/chunking?view=chunks` that selects documents from the active knowledge base, SHALL use bounded hierarchy and filtered page endpoints rather than the compatibility complete-list route, and SHALL render one exclusive empty, flat, or hierarchical outline mode from the backend hierarchy contract.

#### Scenario: Select a hierarchical document
- **WHEN** hierarchy returns a positive parent total and `flatChunkCount=0`
- **THEN** the explorer SHALL render bounded parent summaries and SHALL NOT request or render a flat population

#### Scenario: Expand a parent
- **WHEN** a user expands a parent summary
- **THEN** the explorer SHALL request a bounded page from `/documents/{documentId}/chunks/page` filtered by that `parentChunkId`
- **AND** SHALL load additional child pages only on demand

#### Scenario: Inspect a flat document
- **WHEN** hierarchy returns zero parents and a nonzero `flatChunkCount`
- **THEN** the explorer SHALL page chunks through `/documents/{documentId}/chunks/page` with `kind=FLAT`
- **AND** SHALL use the returned total rather than materializing the whole document
- **AND** SHALL render returned persisted `kind=CHILD` records without requiring a stored `FLAT` kind

#### Scenario: Inspect an empty document
- **WHEN** hierarchy returns zero parents and `flatChunkCount=0`
- **THEN** the explorer SHALL render an empty chunk state and SHALL NOT request a flat page

#### Scenario: Assert compatibility route is unused
- **WHEN** users navigate, expand, page, or select chunks in the explorer
- **THEN** no request SHALL target `/documents/{documentId}/chunks`

### Requirement: Explorer handles document lifecycle and partial failures
The system SHALL provide explicit states for unprocessed documents, empty results, topology conflicts, outline/detail errors, empty child pages, and document removal or replacement.

#### Scenario: Document is unprocessed
- **WHEN** the selected document has no processed chunk output
- **THEN** the explorer SHALL explain that processing is required and link back to Documents

#### Scenario: Document has no chunks
- **WHEN** hierarchy is empty and `flatChunkCount` is zero
- **THEN** the explorer SHALL show an empty chunk state rather than a failed or blank outline

#### Scenario: Document topology is invalid
- **WHEN** the hierarchy endpoint returns RFC 7807 `409 Conflict` with detail `Document chunk topology is invalid`
- **THEN** the explorer SHALL show a dedicated document-integrity error and SHALL NOT request or render hierarchy-child or flat collection branches
- **AND** any already loaded authoritative direct chunk detail SHALL remain visible for diagnosis

#### Scenario: Active outline request fails
- **WHEN** a hierarchy, child, or flat request for the active exclusive outline mode fails for a reason other than the topology conflict
- **THEN** the explorer SHALL retain selected detail and other successfully loaded data
- **AND** SHALL provide request-specific error and retry feedback
