## ADDED Requirements

### Requirement: Standalone input fields MUST have attached labels
The system SHALL provide explicit attached labels for standalone input and textarea fields that describe the field purpose.

#### Scenario: Render standalone form field
- **WHEN** a user views a standalone input or textarea control outside table cells
- **THEN** the system SHALL render an attached label describing what the field is for

### Requirement: Standalone text output blocks MUST be described
The system SHALL provide descriptive labels or headings for standalone text output regions.

#### Scenario: Render generated output preview
- **WHEN** a text output block is shown (for example JSON/YAML/result preview)
- **THEN** the system SHALL show a descriptive label or heading indicating what the output represents

### Requirement: Table-embedded input fields are exempt
The system SHALL allow table-embedded input fields to omit attached labels when table headers/row context already define purpose.

#### Scenario: Render editable table cell input
- **WHEN** an input is rendered inside a table row/cell for inline editing
- **THEN** the system MAY omit a separate attached label for that input
