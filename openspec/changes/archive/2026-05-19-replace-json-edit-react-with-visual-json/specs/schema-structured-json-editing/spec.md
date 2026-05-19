## ADDED Requirements

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
