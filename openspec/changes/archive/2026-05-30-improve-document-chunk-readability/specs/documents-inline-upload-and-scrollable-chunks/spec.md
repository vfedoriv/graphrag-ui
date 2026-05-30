## MODIFIED Requirements

### Requirement: Chunk text output uses bounded dual-axis scrolling
The system SHALL render document chunk output in a dual-mode inspector. The inspector SHALL default to a readable chunk view with one visual section per chunk, SHALL expose a raw JSON mode for the complete response payload, and SHALL keep oversized chunk output bounded so it does not destabilize page width or height.

#### Scenario: Chunk output contains long lines and many rows
- **WHEN** chunk output exceeds container width and height
- **THEN** the output area SHALL keep page width stable and provide scrolling within the chunk inspector or raw JSON output container

#### Scenario: View chunks in readable mode by default
- **WHEN** a user clicks `View chunks` for a document and chunks load successfully
- **THEN** the page SHALL show readable per-chunk sections by default instead of a single raw JSON text dump

#### Scenario: Readable chunk section shows key fields
- **WHEN** chunk data is shown in readable mode
- **THEN** each chunk section SHALL show the chunk index, chunk id, token estimate when available, source metadata when available, and the chunk text in a wrapped readable text area

#### Scenario: Switch to raw JSON mode
- **WHEN** a user selects raw JSON mode for loaded chunks
- **THEN** the page SHALL show the complete chunk response as formatted JSON in a bounded scrollable output container

#### Scenario: Switch back to readable mode
- **WHEN** a user selects readable mode after viewing raw JSON
- **THEN** the page SHALL return to the per-chunk readable sections without refetching chunks solely because of the mode change
