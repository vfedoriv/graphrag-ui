## MODIFIED Requirements

### Requirement: Users can upload and process documents per knowledge base
The system SHALL support multipart file upload to the selected knowledge base and SHALL expose an explicit upload button that opens file chooser for selecting the document. The Documents page SHALL present this upload workflow inline without endpoint tabs. The system SHALL call document process endpoint with `allowOverwrite=false` by default and SHALL require explicit user confirmation before sending process with `allowOverwrite=true` for a document already marked completed/successfully processed. The system SHALL also allow option-aware processing requests to send backend-validated one-run option overrides in the process request body. While a process request is running, only the Process button or option-aware process action for the document row that initiated the request SHALL render pending/loading state.

#### Scenario: Upload document using explicit file-select button
- **WHEN** a user clicks the upload button, picks a file, and confirms upload while a knowledge base is selected
- **THEN** the system SHALL send multipart upload request scoped to that knowledge base and surface upload result state

#### Scenario: Process document first attempt uses overwrite disabled
- **WHEN** a user starts processing a document from the Documents page and the document is not marked completed/successfully processed
- **THEN** the system SHALL send process request for that document with `allowOverwrite=false`

#### Scenario: Process document with one-run options
- **WHEN** a user starts processing a document with configured one-run option overrides
- **THEN** the system SHALL send a process request for that document with a JSON body containing `allowOverwrite` and `options`
- **AND** the request SHALL preserve the same overwrite decision rules as the simple Process action

#### Scenario: Confirm overwrite before reprocessing completed document
- **WHEN** a user starts processing a document that is marked completed/successfully processed
- **THEN** the system SHALL show a confirmation dialog before issuing process request

#### Scenario: Decline overwrite confirmation
- **WHEN** overwrite confirmation dialog is shown and user declines
- **THEN** the system SHALL NOT send process request with `allowOverwrite=true` and SHALL keep existing document state unchanged

#### Scenario: Confirm overwrite and process completed document
- **WHEN** overwrite confirmation dialog is shown and user confirms
- **THEN** the system SHALL send process request with `allowOverwrite=true`

#### Scenario: Backend returns conflict for non-overwrite process
- **WHEN** the system sends process request with `allowOverwrite=false` and backend responds with HTTP `409`
- **THEN** the system SHALL treat the response as overwrite-not-allowed conflict and render actionable process feedback

#### Scenario: Process pending indicator remains row-specific
- **WHEN** a user clicks Process for one document row
- **THEN** only that row's Process button SHALL show pending/loading text and other rows' Process buttons SHALL remain visually unchanged

#### Scenario: Option-aware process pending indicator remains row-specific
- **WHEN** a user starts option-aware processing for one document
- **THEN** only that document's process action SHALL show pending/loading feedback
- **AND** other document rows SHALL remain visually unchanged
