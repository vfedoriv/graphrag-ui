## ADDED Requirements

### Requirement: Documents page provides inline upload with action-driven chunk inspection
The system SHALL render the Documents page without endpoint tabs, SHALL keep `Upload document` directly accessible in the page content, and SHALL expose `View chunks` from document rows to inspect chunk output inline.

#### Scenario: Open Documents page and upload without tabs
- **WHEN** a user opens the Documents page with a knowledge base selected
- **THEN** the page SHALL not show endpoint tabs and SHALL show upload controls directly in the page

#### Scenario: View chunks from document row action
- **WHEN** a user clicks `View chunks` for a document in the list
- **THEN** the page SHALL show chunk output for that document in an inline output area

### Requirement: Chunk text output uses bounded dual-axis scrolling
The system SHALL render document chunk output in a bounded text container that provides both vertical and horizontal scrollbars for oversized content.

#### Scenario: Chunk output contains long lines and many rows
- **WHEN** chunk output exceeds container width and height
- **THEN** the output area SHALL keep page width stable and provide horizontal and vertical scrolling within the output container
