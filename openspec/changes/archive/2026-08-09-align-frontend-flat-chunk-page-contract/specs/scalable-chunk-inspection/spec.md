## MODIFIED Requirements

### Requirement: Chunk Explorer uses only bounded collection reads
The system SHALL provide a Chunk Explorer at `/chunking?view=chunks` that selects documents from the active knowledge base and SHALL use bounded hierarchy and filtered page endpoints rather than the compatibility complete-list route. The filtered page endpoint SHALL use the documented request kind selectors, including virtual `kind=FLAT` for the bounded unparented-child population. The virtual selector depends on backend commit `2c4527b` being deployed.

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
- **THEN** the explorer SHALL page non-parent chunks through `/documents/{documentId}/chunks/page` with `kind=FLAT`
- **AND** SHALL use the returned total rather than materializing the whole document
- **AND** SHALL render the returned persisted response kind, typically `CHILD`, rather than requiring a `FLAT` response kind

#### Scenario: Backend returns a mixed hierarchy and flat compatibility population
- **WHEN** hierarchy returns parent summaries and a nonzero flat count
- **THEN** the explorer SHALL make both bounded populations navigable without discarding either
- **AND** SHALL keep the flat population isolated from parented `CHILD` pages by using `kind=FLAT`
- **AND** SHALL preserve the returned flat records as unparented persisted chunks
- **AND** this response compatibility MAY be verified with canonical automated fixtures because the supported processing workflow does not create mixed populations

#### Scenario: Assert compatibility route is unused
- **WHEN** users navigate, expand, page, or select chunks in the explorer
- **THEN** no request SHALL target `/documents/{documentId}/chunks`
