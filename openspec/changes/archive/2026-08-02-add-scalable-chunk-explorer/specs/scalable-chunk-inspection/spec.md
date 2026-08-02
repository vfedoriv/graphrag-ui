## ADDED Requirements

### Requirement: Chunk Explorer uses only bounded collection reads
The system SHALL provide a Chunk Explorer at `/chunking?view=chunks` that selects documents from the active knowledge base and SHALL use bounded hierarchy and filtered page endpoints rather than the compatibility complete-list route.

#### Scenario: Select a hierarchical document
- **WHEN** a processed document is selected
- **THEN** the explorer SHALL request a bounded metadata-only page from `/documents/{documentId}/chunks/hierarchy`
- **AND** SHALL show server page totals and `flatChunkCount`

#### Scenario: Expand a parent
- **WHEN** a user expands a parent summary
- **THEN** the explorer SHALL request a bounded page from `/documents/{documentId}/chunks/page` filtered by that `parentChunkId`
- **AND** SHALL load additional child pages only on demand

#### Scenario: Inspect a flat or legacy document
- **WHEN** hierarchy has no parents and reports a nonzero `flatChunkCount`
- **THEN** the explorer SHALL page non-parent chunks through `/documents/{documentId}/chunks/page`
- **AND** SHALL use the returned total rather than materializing the whole document

#### Scenario: Mixed hierarchy and flat chunks exist
- **WHEN** hierarchy returns parent summaries and a nonzero flat count
- **THEN** the explorer SHALL make both bounded populations navigable without discarding either

#### Scenario: Assert compatibility route is unused
- **WHEN** users navigate, expand, page, or select chunks in the explorer
- **THEN** no request SHALL target `/documents/{documentId}/chunks`

### Requirement: Chunk outline remains concise and page-driven
The system SHALL render outline rows from server summaries with concise page/source range, section, structural path, child-count, token, and revision context while keeping page controls tied to server totals.

#### Scenario: Render parent summary
- **WHEN** a hierarchy row includes page range, section indices, structural path, child count, and token estimate
- **THEN** the outline SHALL show concise labeled values without loading parent text

#### Scenario: Change outline page
- **WHEN** a user navigates to another hierarchy, child, or flat page
- **THEN** the explorer SHALL request that page and SHALL not concatenate all pages into an unbounded client list

#### Scenario: Child page is empty
- **WHEN** an expanded parent returns an empty child page
- **THEN** the parent SHALL remain visible with an explicit no-children-on-this-page state and retry/paging controls when applicable

### Requirement: Selected chunk detail is authoritative
The system SHALL fetch `/documents/{documentId}/chunks/{chunkId}` for the selected chunk and SHALL render its full authoritative text and provenance separately from summary rows.

#### Scenario: Select a chunk row
- **WHEN** a user selects a parent, child, or flat chunk
- **THEN** the explorer SHALL directly fetch that chunk
- **AND** SHALL show text, indices, hierarchy kind, source offsets/pages, structural path, processing run, chunk settings/strategy/effective/representation revisions, tokenizer, source/settings hashes, confidence, and raw metadata when available

#### Scenario: Legacy provenance is absent
- **WHEN** a directly fetched chunk has null legacy provenance
- **THEN** the detail SHALL show explicit unavailable values where useful
- **AND** SHALL not render broken placeholders or infer metadata

#### Scenario: Direct lookup fails
- **WHEN** the owned direct route returns a non-ownership `404` or another error
- **THEN** the explorer SHALL distinguish not-found/ownership-safe feedback from retryable page or transport errors

### Requirement: Chunk deep links resolve without unbounded scans
The system SHALL support `/chunking?view=chunks&documentId=...&chunkId=...` by fetching the chunk directly before attempting to reveal it in the paged outline.

#### Scenario: Deep-linked chunk is a child
- **WHEN** direct lookup returns a child with a parent ID
- **THEN** the explorer SHALL load or directly resolve the parent and expand a bounded child page
- **AND** SHALL select the child detail

#### Scenario: Parent lies outside the current hierarchy page
- **WHEN** the deep-linked child's parent is not in the visible hierarchy page
- **THEN** the explorer SHALL preserve the directly fetched selection
- **AND** SHALL offer bounded navigation/reveal guidance without scanning every hierarchy page

#### Scenario: Deep-linked chunk is flat
- **WHEN** direct lookup returns a chunk without a hierarchy parent
- **THEN** the explorer SHALL preserve its detail and offer flat-page navigation when its page can be determined

### Requirement: Explorer state follows explicit knowledge-base ownership
The system SHALL scope document choices and chunk selections to the globally selected knowledge base and SHALL never switch that selection automatically to satisfy a deep link.

#### Scenario: Knowledge base changes
- **WHEN** the global knowledge base changes while a document or chunk is selected
- **THEN** the explorer SHALL clear incompatible `documentId` and `chunkId` parameters and document-scoped caches
- **AND** SHALL display an explanatory notice

#### Scenario: Deep-linked document is not in the selected knowledge base
- **WHEN** the document list or ownership-safe lookup proves that a URL ID is incompatible
- **THEN** the explorer SHALL clear the invalid ID, preserve the selected knowledge base, and show an explanatory notice

### Requirement: Explorer handles document lifecycle and partial failures
The system SHALL provide explicit states for unprocessed documents, empty hierarchy/flat results, independent outline/detail errors, empty child pages, and document removal or replacement.

#### Scenario: Document is unprocessed
- **WHEN** the selected document has no processed chunk output
- **THEN** the explorer SHALL explain that processing is required and link back to Documents

#### Scenario: Document has no chunks
- **WHEN** hierarchy is empty and `flatChunkCount` is zero
- **THEN** the explorer SHALL show an empty chunk state rather than a failed or blank outline

#### Scenario: One outline branch fails
- **WHEN** a hierarchy, child, or flat page request fails
- **THEN** the explorer SHALL retain other successfully loaded branches and selected detail
- **AND** SHALL provide branch-specific error and retry feedback
