## ADDED Requirements

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
