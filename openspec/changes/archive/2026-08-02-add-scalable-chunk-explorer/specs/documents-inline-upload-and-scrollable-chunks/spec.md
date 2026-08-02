## MODIFIED Requirements

### Requirement: Documents page provides inline upload with action-driven chunk inspection
The system SHALL render the Documents page without endpoint tabs, SHALL keep `Upload document` directly accessible in the page content, and SHALL expose `Inspect chunking` from document rows to open the selected document in the dedicated Chunking explorer.

#### Scenario: Open Documents page and upload without tabs
- **WHEN** a user opens the Documents page with a knowledge base selected
- **THEN** the page SHALL not show endpoint tabs and SHALL show upload controls directly in the page

#### Scenario: Inspect chunks from document row action
- **WHEN** a user clicks `Inspect chunking` for a document in the list
- **THEN** the page SHALL navigate to `/chunking?view=chunks&documentId={documentId}`
- **AND** SHALL NOT load the complete chunk response inline

## REMOVED Requirements

### Requirement: Chunk text output uses bounded dual-axis scrolling
**Reason**: Complete-list chunk rendering on Documents does not scale and is replaced by bounded hierarchy/page/direct reads in the Chunking explorer.

**Migration**: Use `/chunking?view=chunks&documentId={documentId}` for paged outline inspection and direct selected-chunk detail.
