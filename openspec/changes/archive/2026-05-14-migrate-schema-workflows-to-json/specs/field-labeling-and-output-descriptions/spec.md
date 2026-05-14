## MODIFIED Requirements

### Requirement: Structured payload fields declare and present expected format
The system SHALL present structured payload fields and previews used by schema workflows with explicit JSON format context and JSON-aware presentation so users can distinguish structured schema content from plain text.

#### Scenario: Render JSON payload field
- **WHEN** a field expects JSON payload input or output
- **THEN** the UI SHALL indicate JSON format and render the content in a JSON-aware text presentation

### Requirement: Structured payload fields support readability formatting actions
The system SHALL provide a formatting action for structured payload fields that normalizes indentation and layout when content is valid JSON.

#### Scenario: Format valid JSON payload
- **WHEN** a user triggers formatting for valid JSON content
- **THEN** the content SHALL be rewritten in normalized pretty-printed JSON form

#### Scenario: Format invalid structured payload
- **WHEN** a user triggers formatting for invalid JSON content
- **THEN** the UI SHALL preserve original text and surface a clear validation/format error message
