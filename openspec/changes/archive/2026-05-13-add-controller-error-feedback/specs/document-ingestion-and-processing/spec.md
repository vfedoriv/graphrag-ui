## ADDED Requirements

### Requirement: Document workflow failures are surfaced for process and chunks
The system SHALL show explicit error feedback for document processing failures and chunk-loading failures in the Documents page.

#### Scenario: Process request fails
- **WHEN** document process request fails
- **THEN** the system SHALL render a visible process failure alert near document actions

#### Scenario: Chunk query fails
- **WHEN** chunk inspection request fails for a selected document
- **THEN** the system SHALL render a visible chunks failure alert instead of rendering undefined output payload
