## ADDED Requirements

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
