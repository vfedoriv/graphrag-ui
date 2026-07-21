## MODIFIED Requirements

### Requirement: Evaluation progress and outcomes are polled from server state
The system SHALL accept evaluation status resources whose run-level metrics and advisory assessment are nullable while results are unavailable, SHALL poll active evaluation runs, SHALL display aggregate document counts and per-document outcomes from the nested standard page envelope independently of result availability, and SHALL stop polling at `COMPLETED`, `PARTIAL`, `FAILED`, or `INTERRUPTED`.

#### Scenario: Start evaluation
- **WHEN** a user starts evaluation with valid held-out documents
- **THEN** the system SHALL poll the returned run resource while it is `QUEUED` or `RUNNING`

#### Scenario: Active evaluation results are not yet available
- **WHEN** a `QUEUED` or `RUNNING` evaluation response contains null run-level metrics and advisory assessment
- **THEN** the system SHALL accept the response without showing a response-shape error
- **AND** SHALL show the run status, aggregate progress, and paged outcomes
- **AND** SHALL continue polling the run
- **AND** SHALL identify the detailed results as still in progress

#### Scenario: Active per-document outcomes are displayed
- **WHEN** an evaluation response contains outcomes with `QUEUED` or `RUNNING` status
- **THEN** the system SHALL accept and display those declared statuses

#### Scenario: Interrupted evaluation has no aggregated results
- **WHEN** an evaluation becomes `INTERRUPTED` before run-level metrics or advisory assessment are produced
- **THEN** the system SHALL accept the nullable result fields and stop polling
- **AND** SHALL retain the run progress and per-document outcomes
- **AND** SHALL identify unavailable result sections without presenting the response as malformed

#### Scenario: Evaluation partially completes
- **WHEN** the run becomes `PARTIAL`
- **THEN** the system SHALL show succeeded, failed, and stale document counts and retain successful results from `outcomes.content`
- **AND** SHALL paginate using `outcomes.page`, `outcomes.size`, and `outcomes.totalElements`

#### Scenario: Evaluation is retried
- **WHEN** a terminal run is retryable and the user confirms retry
- **THEN** the system SHALL send the latest draft revision to the retry endpoint
- **AND** SHALL identify `REUSED` outcomes separately from newly executed outcomes
