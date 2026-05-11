## ADDED Requirements

### Requirement: Users can upload and process documents per knowledge base
The system SHALL support multipart file upload to the selected knowledge base and allow triggering document processing from document list views.

#### Scenario: Upload document to selected knowledge base
- **WHEN** a user selects a file and submits upload while a knowledge base is selected
- **THEN** the system SHALL send multipart upload request scoped to that knowledge base and surface upload result state

### Requirement: Users can inspect document processing outputs
The system SHALL display document processing status, processing errors, and retrievable chunk data for selected documents.

#### Scenario: Inspect chunks after processing
- **WHEN** document processing succeeds and user opens chunk inspection
- **THEN** the system SHALL display returned chunk entries associated with the processed document
