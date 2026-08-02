## Purpose

This specification defines the Documents page inline upload and chunk inspection behavior in the GraphRAG admin UI.

## Requirements

### Requirement: Documents page provides inline upload with action-driven chunk inspection
The system SHALL render the Documents page without endpoint tabs, SHALL keep `Upload document` directly accessible in the page content, and SHALL expose `Inspect chunking` from document rows to open the selected document in the dedicated Chunking explorer.

#### Scenario: Open Documents page and upload without tabs
- **WHEN** a user opens the Documents page with a knowledge base selected
- **THEN** the page SHALL not show endpoint tabs and SHALL show upload controls directly in the page

#### Scenario: Inspect chunks from document row action
- **WHEN** a user clicks `Inspect chunking` for a document in the list
- **THEN** the page SHALL navigate to `/chunking?view=chunks&documentId={documentId}`
- **AND** SHALL NOT load the complete chunk response inline
