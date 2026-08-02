## Purpose

This specification defines the required behavior for document ingestion and processing in the GraphRAG admin UI.
## Requirements
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

### Requirement: Users can inspect document processing outputs
The system SHALL allow users to inspect document processing status and options within the Documents page through direct actions, and SHALL hand chunk inspection to the dedicated scalable Chunking explorer without downloading the complete chunk list on Documents.

#### Scenario: View processing outputs after execution
- **WHEN** a document processing workflow completes
- **THEN** the system SHALL show resulting status and applicable processing output context in the Documents page

#### Scenario: Inspect chunks for a selected document
- **WHEN** a user requests chunk inspection for a document
- **THEN** the system SHALL navigate to `/chunking?view=chunks&documentId={documentId}`
- **AND** SHALL preserve the globally selected knowledge base

#### Scenario: Documents does not materialize chunks
- **WHEN** the Documents page lists or manages documents
- **THEN** it SHALL NOT request the compatibility complete-list chunk route for inline rendering

### Requirement: Document workflow failures are surfaced for process and handoff
The system SHALL show explicit error feedback for document processing failures and SHALL keep chunk-inspection handoff available only for an owned document row.

#### Scenario: Process request fails
- **WHEN** document process request fails
- **THEN** the system SHALL render a visible process failure alert near document actions

#### Scenario: Chunk inspection handoff is selected
- **WHEN** a user activates `Inspect chunking` for an owned document
- **THEN** the system SHALL navigate with that document ID rather than loading chunks within Documents

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

### Requirement: Users can view document source context
The system SHALL expose backend-provided document source-file context actions in the Documents page when document responses include `localPath` or `contentUri`.

#### Scenario: Listed document includes local path
- **WHEN** the documents list endpoint returns a document with `localPath`
- **THEN** the Documents page SHALL render source context actions for that document without displaying the raw local filesystem path in the table

#### Scenario: Listed document has no local path
- **WHEN** the documents list endpoint returns a document without `localPath`
- **THEN** the Documents page SHALL keep the document row usable and SHALL NOT render a broken source-path value

#### Scenario: Copy source path
- **WHEN** a document row has `localPath` and the user chooses to copy the path
- **THEN** the system SHALL copy the local path value to the clipboard and preserve the current document list and chunk selection state

### Requirement: Users can open stored documents from source context
The system SHALL provide an action for opening a stored document from the Documents page when a document response includes a usable `contentUri` or `localPath`.

#### Scenario: Open document using local helper
- **WHEN** a document row has `localPath` and the user chooses to open the document
- **THEN** the system SHALL request local file opening through the trusted local UI server helper

#### Scenario: Open document success is acknowledged
- **WHEN** the local UI server helper accepts the open request
- **THEN** the Documents page SHALL show a message that the document opened in another window
- **AND** the message SHALL disappear after 10 seconds

#### Scenario: Local helper is unavailable
- **WHEN** the local UI server helper is unavailable or rejects the open request
- **THEN** the Documents page SHALL render visible open failure feedback
- **AND** the Copy path action SHALL remain available when `localPath` exists

#### Scenario: No source context available
- **WHEN** a document row has neither `contentUri` nor `localPath`
- **THEN** the system SHALL disable or hide the open-document action for that row

### Requirement: Users can replace uploaded documents
The system SHALL allow users to replace an existing document from the Documents page by sending a multipart replacement file to the selected knowledge base and target document id.

#### Scenario: Confirm and replace document
- **WHEN** a user selects a replacement file for a document row and confirms the replacement
- **THEN** the system SHALL send a multipart `PUT` request to `/knowledge-bases/{knowledgeBaseId}/documents/{documentId}` with the selected file
- **AND** the system SHALL refresh the documents list after the replacement succeeds

#### Scenario: Decline document replacement
- **WHEN** a user selects a replacement file for a document row and declines confirmation
- **THEN** the system SHALL NOT send the replacement request

#### Scenario: Replacement clears selected chunks
- **WHEN** a replacement succeeds for the document currently selected for chunk inspection
- **THEN** the system SHALL clear or refresh the selected document chunk output so stale chunks are not presented as current

#### Scenario: Replacement request fails
- **WHEN** the replacement request fails
- **THEN** the system SHALL render visible replacement failure feedback near document actions
- **AND** the existing document list SHALL remain visible

#### Scenario: Replacement pending indicator is row-specific
- **WHEN** a user starts replacing one document row
- **THEN** only that row's replacement action SHALL show pending/loading feedback

### Requirement: Users can delete uploaded documents
The system SHALL allow users to delete an existing document from the Documents page by sending a delete request scoped to the selected knowledge base and target document id.

#### Scenario: Confirm and delete document
- **WHEN** a user chooses Delete for a document row and confirms deletion
- **THEN** the system SHALL send `DELETE /knowledge-bases/{knowledgeBaseId}/documents/{documentId}`
- **AND** the system SHALL refresh the documents list after deletion succeeds

#### Scenario: Decline document deletion
- **WHEN** a user chooses Delete for a document row and declines confirmation
- **THEN** the system SHALL NOT send the delete request

#### Scenario: Delete clears selected document state
- **WHEN** deletion succeeds for the document currently selected for chunk inspection
- **THEN** the system SHALL clear the selected document and chunk output state

#### Scenario: Delete request fails
- **WHEN** the delete request fails
- **THEN** the system SHALL render visible delete failure feedback near document actions
- **AND** the existing document list SHALL remain visible

#### Scenario: Delete pending indicator is row-specific
- **WHEN** a user starts deleting one document row
- **THEN** only that row's delete action SHALL show pending/loading feedback
