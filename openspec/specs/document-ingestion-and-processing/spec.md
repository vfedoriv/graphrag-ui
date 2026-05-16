## Purpose

This specification defines the required behavior for document ingestion and processing in the GraphRAG admin UI.
## Requirements
### Requirement: Users can upload and process documents per knowledge base
The system SHALL support multipart file upload to the selected knowledge base and SHALL expose an explicit upload button that opens file chooser for selecting the document. The Documents page SHALL present this upload workflow inline without endpoint tabs. The system SHALL call document process endpoint with `allowOverwrite=false` by default and SHALL require explicit user confirmation before sending process with `allowOverwrite=true` for a document already marked completed/successfully processed. While a process request is running, only the Process button for the document row that initiated the request SHALL render pending/loading state.

#### Scenario: Upload document using explicit file-select button
- **WHEN** a user clicks the upload button, picks a file, and confirms upload while a knowledge base is selected
- **THEN** the system SHALL send multipart upload request scoped to that knowledge base and surface upload result state

#### Scenario: Process document first attempt uses overwrite disabled
- **WHEN** a user starts processing a document from the Documents page and the document is not marked completed/successfully processed
- **THEN** the system SHALL send process request for that document with `allowOverwrite=false`

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

### Requirement: Users can inspect document processing outputs
The system SHALL allow users to inspect processing outputs within the Documents page through direct document actions without requiring tab navigation, and chunk outputs SHALL be shown in a bounded text area with both horizontal and vertical scrolling.

#### Scenario: View processing outputs after execution
- **WHEN** a document processing workflow completes
- **THEN** the system SHALL show resulting outputs/status in the Documents page inline workflow area

#### Scenario: View chunks for a selected document
- **WHEN** a user requests chunk inspection for a document
- **THEN** the system SHALL render chunk text output in a constrained container with horizontal and vertical scrollbars

### Requirement: Document workflow failures are surfaced for process and chunks
The system SHALL show explicit error feedback for document processing failures and chunk-loading failures in the Documents page.

#### Scenario: Process request fails
- **WHEN** document process request fails
- **THEN** the system SHALL render a visible process failure alert near document actions

#### Scenario: Chunk query fails
- **WHEN** chunk inspection request fails for a selected document
- **THEN** the system SHALL render a visible chunks failure alert instead of rendering undefined output payload

### Requirement: Document queries use nullable-safe query keys
The system SHALL use explicit query-key factories for document list and document chunk queries, including disabled states when the required knowledge-base or document id is missing.

#### Scenario: No knowledge base selected for documents list
- **WHEN** the Documents page renders without a selected knowledge base
- **THEN** the documents query SHALL use a stable disabled key and SHALL NOT invoke the documents list endpoint

#### Scenario: No document selected for chunks
- **WHEN** no document is selected for chunk inspection
- **THEN** the chunks query SHALL use a stable disabled key and SHALL NOT invoke the chunks endpoint

### Requirement: Row-specific document processing state remains client-owned
The system SHALL keep row-specific process pending indicators scoped to the document rows that initiated processing while still using mutation state for backend request lifecycle and errors.

#### Scenario: Process one document row
- **WHEN** a user starts processing one document
- **THEN** only that document row SHALL show row-specific pending feedback and the global mutation error state SHALL remain available for process failures

### Requirement: Document processing indicators survive Documents page remount
The system SHALL render row-level processing feedback for documents whose backend status indicates active processing, even after the user navigates away from and back to the Documents page.

#### Scenario: Return to Documents while backend processing continues
- **WHEN** a user starts processing a document, navigates away from the Documents page, and returns while the document list reports that document with an in-progress backend status
- **THEN** the document row SHALL show the Process button in pending state with `Processing...` and SHALL keep that button disabled

#### Scenario: Backend returns in-progress document without local mutation state
- **WHEN** the Documents page loads a document with an in-progress backend status such as `EXTRACTING_GRAPH`
- **THEN** the corresponding document row SHALL show processing feedback even if the current page instance did not initiate the process request

#### Scenario: Backend returns idle document status
- **WHEN** the Documents page loads a document with an idle, completed, failed, or uploaded status
- **THEN** the corresponding document row SHALL show the normal actionable `Process` button unless another local process request for that row is active

### Requirement: Document process status classification is tested
The system SHALL test the document status classification used for process button state so known backend statuses do not regress route-remount behavior.

#### Scenario: Known in-progress status is classified as processing
- **WHEN** document status classification receives `EXTRACTING_GRAPH`
- **THEN** it SHALL classify the status as actively processing

#### Scenario: Known terminal statuses are not classified as processing
- **WHEN** document status classification receives completed, failed, or uploaded statuses
- **THEN** it SHALL NOT classify those statuses as actively processing

