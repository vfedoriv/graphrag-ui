## MODIFIED Requirements

### Requirement: Users can upload and process documents per knowledge base
The system SHALL support multipart file upload to the selected knowledge base and SHALL expose an explicit upload button that opens file chooser for selecting the document. The Documents page SHALL present this upload workflow inline without endpoint tabs.

#### Scenario: Upload document using explicit file-select button
- **WHEN** a user clicks the upload button, picks a file, and confirms upload while a knowledge base is selected
- **THEN** the system SHALL send multipart upload request scoped to that knowledge base and surface upload result state

### Requirement: Users can inspect document processing outputs
The system SHALL allow users to inspect processing outputs within the Documents page through direct document actions without requiring tab navigation, and chunk outputs SHALL be shown in a bounded text area with both horizontal and vertical scrolling.

#### Scenario: View processing outputs after execution
- **WHEN** a document processing workflow completes
- **THEN** the system SHALL show resulting outputs/status in the Documents page inline workflow area

#### Scenario: View chunks for a selected document
- **WHEN** a user requests chunk inspection for a document
- **THEN** the system SHALL render chunk text output in a constrained container with horizontal and vertical scrollbars
