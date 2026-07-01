## ADDED Requirements

### Requirement: Document processing options are discoverable from the Documents page
The system SHALL allow users to load backend-provided processing option metadata for a selected uploaded document from the Documents page.

#### Scenario: User opens processing options for a document
- **WHEN** a user chooses the processing options action for a document row
- **THEN** the system SHALL select that document and request `GET /api/v1/documents/{documentId}/processing-options`
- **AND** the system SHALL show the detected parser identifier and file format returned by the backend
- **AND** the system SHALL show the selected document workflow without navigating away from the Documents page

#### Scenario: Unsupported document type
- **WHEN** the processing options request fails because the backend rejects the document type
- **THEN** the system SHALL render visible error feedback in the selected document workflow
- **AND** the existing document list SHALL remain visible and actionable

#### Scenario: No document selected
- **WHEN** no document is selected for processing options
- **THEN** the system SHALL NOT request document processing options
- **AND** the system SHALL show guidance to select a document from the table

### Requirement: Processing option controls are generated from backend metadata
The system SHALL render editable processing option controls from the option definitions returned by the backend instead of hardcoding parser-specific option keys.

#### Scenario: Boolean option is rendered
- **WHEN** an applicable option has `valueType` equal to `BOOLEAN`
- **THEN** the system SHALL render a binary control using the backend label, description, default value, and saved default value when present

#### Scenario: Integer option is rendered
- **WHEN** an applicable option has `valueType` equal to `INTEGER`
- **THEN** the system SHALL render a numeric control
- **AND** the system SHALL apply minimum and maximum constraints from the backend response when supplied

#### Scenario: String option with allowed values is rendered
- **WHEN** an applicable option has `valueType` equal to `STRING` and includes allowed values
- **THEN** the system SHALL render a choice control containing the backend-provided allowed values

#### Scenario: String option without allowed values is rendered
- **WHEN** an applicable option has `valueType` equal to `STRING` and does not include allowed values
- **THEN** the system SHALL render a text input control

#### Scenario: Immutable option is rendered read-only
- **WHEN** an applicable option has `mutable` equal to `false`
- **THEN** the system SHALL show the option value as read-only
- **AND** the system SHALL NOT include that option key in save-defaults or process-override payloads

### Requirement: Users can save and clear document processing defaults
The system SHALL allow users to replace or clear document-scoped processing defaults for the selected document.

#### Scenario: Save processing defaults
- **WHEN** a user edits mutable option values and chooses to save defaults
- **THEN** the system SHALL send `PUT /api/v1/documents/{documentId}/processing-options/defaults` with body `{ "options": <mutable option values> }`
- **AND** the system SHALL refresh the processing options for that document after the save succeeds
- **AND** the system SHALL show saved-default state returned by the backend

#### Scenario: Save defaults validation fails
- **WHEN** the backend rejects the save-defaults request with validation errors
- **THEN** the system SHALL render visible error feedback in the processing options workflow
- **AND** the system SHALL preserve the user's draft values for correction

#### Scenario: Clear processing defaults
- **WHEN** a user chooses to clear saved defaults for the selected document
- **THEN** the system SHALL send `DELETE /api/v1/documents/{documentId}/processing-options/defaults`
- **AND** the system SHALL refresh the processing options for that document after the clear succeeds
- **AND** the option controls SHALL return to backend built-in defaults unless new saved defaults are returned

### Requirement: Users can process a document with one-run option overrides
The system SHALL allow users to run document processing with mutable option values from the selected document workflow without mutating saved document defaults.

#### Scenario: Process with option overrides
- **WHEN** a user chooses to process the selected document with options
- **THEN** the system SHALL send `POST /api/v1/documents/{documentId}/process` with a JSON body containing `allowOverwrite` and `options`
- **AND** the `options` object SHALL contain the current mutable option values
- **AND** the system SHALL NOT send a conflicting `allowOverwrite` query parameter for that option-aware request

#### Scenario: Process completed document with option overrides
- **WHEN** a user chooses to process a completed or successfully processed document with options
- **THEN** the system SHALL require overwrite confirmation before sending the request
- **AND** the system SHALL send body `allowOverwrite` as `true` only after the user confirms

#### Scenario: Decline option-aware overwrite confirmation
- **WHEN** overwrite confirmation is shown for option-aware processing and the user declines
- **THEN** the system SHALL NOT send the process request
- **AND** the option draft and document list SHALL remain visible

#### Scenario: Option-aware process succeeds
- **WHEN** option-aware processing completes successfully
- **THEN** the system SHALL refresh the documents list
- **AND** the system SHALL refresh or invalidate chunks for the processed document
- **AND** the system SHALL keep saved defaults unchanged unless the user separately saved defaults

#### Scenario: Option-aware process validation fails
- **WHEN** the backend rejects option-aware processing because an option value is invalid
- **THEN** the system SHALL render visible process error feedback in the selected document workflow
- **AND** the system SHALL preserve the user's option draft for correction

### Requirement: Processing options use nullable-safe query keys
The system SHALL use explicit query-key factories for document processing option queries, including disabled states when no document id is selected.

#### Scenario: Selected document has processing options query
- **WHEN** a document is selected for processing options
- **THEN** the system SHALL use a stable processing-options query key scoped to that document id

#### Scenario: No selected document for processing options query
- **WHEN** no document is selected
- **THEN** the processing-options query SHALL use a stable disabled key
- **AND** the query SHALL NOT invoke the processing-options endpoint
