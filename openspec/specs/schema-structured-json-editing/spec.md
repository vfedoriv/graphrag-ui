# schema-structured-json-editing Specification

## Purpose
TBD - created by archiving change use-json-edit-react-for-schema-editors. Update Purpose after archive.
## Requirements
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

### Requirement: Schema JSON editor supports switchable Tree View and Raw View
The system SHALL provide colocated Tree View and Raw View controls for each schema JSON editor instance so users can switch between structured JSON editing and direct JSON text editing.

#### Scenario: Switch from Tree View to Raw View
- **WHEN** a user selects Raw View for a schema JSON editor that contains valid structured JSON
- **THEN** the system SHALL show the same schema draft as editable JSON text without changing the draft content

#### Scenario: Switch from Raw View to Tree View with valid JSON
- **WHEN** a user edits valid JSON text in Raw View and selects Tree View
- **THEN** the system SHALL render the edited JSON document in the structured JSON editor without requiring the user to reload the page or change tabs

#### Scenario: Tree View unavailable for invalid Raw View text
- **WHEN** a user edits Raw View text so it cannot be parsed into structured JSON data
- **THEN** the system SHALL preserve the invalid text, show a visible parse error, and keep the user in Raw View until the JSON can be parsed

#### Scenario: View switch is colocated with each editor usage
- **WHEN** a schema workflow renders a schema JSON editor for validation, creation, or generated output review
- **THEN** the system SHALL show the Tree View and Raw View controls next to that editor instance

### Requirement: Schema JSON editor supports whole-document JSON paste
The system SHALL allow users to paste or replace the complete JSON document from the clipboard in Raw View while preserving Tree View as the structured valid-JSON editing surface.

#### Scenario: Paste valid complete schema JSON
- **WHEN** a user pastes a complete valid JSON document into Raw View
- **THEN** the system SHALL update the schema draft used by validation and creation workflows with the pasted JSON content

#### Scenario: Pasted JSON renders as structured data
- **WHEN** a pasted complete JSON document is valid and the user selects Tree View
- **THEN** the system SHALL render the pasted document in the structured JSON editor without requiring the user to reload the page or change tabs

#### Scenario: Paste invalid complete schema JSON
- **WHEN** a user pastes JSON text in Raw View that cannot be parsed into structured data
- **THEN** the system SHALL preserve the pasted text and show a visible parse error without replacing it with an empty object or the previous valid document

#### Scenario: Whole-document paste is disabled while editor is read-only
- **WHEN** the schema JSON editor is disabled during a pending workflow
- **THEN** the system SHALL prevent Raw View from changing the draft

