## Purpose

This specification defines the required behavior for field labeling and output descriptions in the GraphRAG admin UI.
## Requirements
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

### Requirement: Structured payload fields declare and present expected format
The system SHALL present YAML/JSON payload fields and previews with explicit format context and syntax-aware presentation so users can distinguish structure from plain text.

#### Scenario: Render JSON payload field
- **WHEN** a field expects JSON payload input or output
- **THEN** the UI SHALL indicate JSON format and render the content in a JSON-aware text presentation

#### Scenario: Render YAML payload field
- **WHEN** a field expects YAML payload input or output
- **THEN** the UI SHALL indicate YAML format and render the content in a YAML-aware text presentation

### Requirement: Structured payload fields support readability formatting actions
The system SHALL provide a formatting action for structured payload fields that normalizes indentation and layout when content is valid for the selected format.

#### Scenario: Format valid JSON payload
- **WHEN** a user triggers formatting for valid JSON content
- **THEN** the content SHALL be rewritten in normalized pretty-printed JSON form

#### Scenario: Format invalid structured payload
- **WHEN** a user triggers formatting for invalid YAML/JSON content
- **THEN** the UI SHALL preserve original text and surface a clear validation/format error message

