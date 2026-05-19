## ADDED Requirements

### Requirement: Schema JSON uses structured tree editing
The system SHALL provide a structured JSON tree editor for schema JSON drafts that allows users to add nodes, remove nodes, move or reorder nodes, and edit primitive values.

#### Scenario: Edit primitive schema value
- **WHEN** a user changes a primitive value in a schema JSON draft through the structured editor
- **THEN** the system SHALL update the schema draft used by validation and creation workflows with the edited JSON content

#### Scenario: Add schema node
- **WHEN** a user adds an object property or array item through the structured editor
- **THEN** the system SHALL include the added node in the schema draft used by validation and creation workflows

#### Scenario: Remove schema node
- **WHEN** a user removes a node through the structured editor
- **THEN** the system SHALL remove that node from the schema draft used by validation and creation workflows

#### Scenario: Move schema node
- **WHEN** a user moves or reorders a node through the structured editor
- **THEN** the system SHALL preserve the moved structure in the schema draft used by validation and creation workflows

### Requirement: Schema JSON editor preserves draft data on invalid JSON
The system SHALL preserve the user's current schema JSON draft and show a visible editor error when the draft cannot be parsed into structured JSON data.

#### Scenario: Invalid draft cannot render as tree
- **WHEN** a schema JSON draft contains invalid JSON text
- **THEN** the system SHALL show a visible parse error and SHALL NOT replace the draft with an empty object or discard the invalid text

#### Scenario: Empty draft starts editable
- **WHEN** a schema JSON editor opens with no existing draft content
- **THEN** the system SHALL provide an editable empty JSON object as the starting structured value

### Requirement: Schema JSON editor keeps API payloads serialized
The system SHALL serialize structured schema JSON edits back to JSON content strings before calling schema validation, schema creation, or schema generation request APIs.

#### Scenario: Validate structured schema draft
- **WHEN** a user validates a schema draft edited through the structured editor
- **THEN** the system SHALL call the validation endpoint with the edited schema JSON serialized in the existing `content` request field

#### Scenario: Create structured schema draft
- **WHEN** a user creates a schema from a draft edited through the structured editor
- **THEN** the system SHALL call the create endpoint with the edited schema JSON serialized in the existing `content` request field
