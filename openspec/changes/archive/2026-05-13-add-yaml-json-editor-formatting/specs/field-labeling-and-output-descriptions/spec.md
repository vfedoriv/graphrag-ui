## ADDED Requirements

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
