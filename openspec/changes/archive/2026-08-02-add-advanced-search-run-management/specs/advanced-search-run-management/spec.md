## ADDED Requirements

### Requirement: Advanced Search evaluates readiness before submission
The system SHALL load readiness for the active knowledge base, display blockers separately from informational degraded capabilities, and disable submission only when backend readiness reports `ready: false`.

#### Scenario: Search is ready
- **WHEN** readiness reports `ready: true`
- **THEN** the workspace SHALL enable valid submission and show profile identity/revision, graph-branch availability, and embedded-corpus presence

#### Scenario: Search has blockers
- **WHEN** readiness reports `ready: false`
- **THEN** Submit SHALL be disabled
- **AND** blocker codes and descriptions SHALL be displayed separately from informational issues

#### Scenario: Active schema is unavailable
- **WHEN** readiness includes informational `SCHEMA_UNAVAILABLE`
- **THEN** the workspace SHALL explain that graph retrieval is unavailable but text-only search remains allowed
- **AND** SHALL NOT treat that issue as a blocker

#### Scenario: Embedded corpus is empty
- **WHEN** readiness includes informational `EMPTY_CORPUS`
- **THEN** the workspace SHALL explain that a run may return insufficient evidence
- **AND** SHALL NOT treat that issue as a blocker

#### Scenario: Scoped dependencies change
- **WHEN** selected knowledge base, active schema, AI-profile assignment, or relevant document-processing state changes
- **THEN** scoped readiness SHALL be invalidated and refetched

### Requirement: Advanced Search preserves backend evidence defaults
The system SHALL make the question and Submit action primary and SHALL place `maximumEvidence` and `includeEvidenceText` in collapsed advanced options, with evidence text enabled and maximum evidence blank initially.

#### Scenario: Submit with default options
- **WHEN** the user submits a valid question without entering maximum evidence
- **THEN** the request SHALL omit `maximumEvidence`
- **AND** SHALL send `includeEvidenceText: true`

#### Scenario: Submit an explicit evidence maximum
- **WHEN** the user enters a valid maximum from 1 through 20
- **THEN** the request SHALL send that integer as `maximumEvidence`

#### Scenario: Runtime hints are available
- **WHEN** runtime settings expose backend-derived default or maximum evidence guidance
- **THEN** the advanced-options panel SHALL display those values as hints
- **AND** SHALL still omit a blank maximum so the backend applies its default

### Requirement: Multiple durable runs can coexist
The system SHALL permit multiple concurrent advanced-search submissions, focus the newest accepted run, and keep older runs available through history without cancelling them.

#### Scenario: Submit while another run is active
- **WHEN** a valid new question is accepted while an older run is non-terminal
- **THEN** the new run SHALL become focused
- **AND** the older run SHALL remain available and continue server-side

#### Scenario: Submission is accepted
- **WHEN** create returns an owned run detail
- **THEN** the workspace SHALL preserve the applied query and evidence options, update history, and set `runId` to the new run

#### Scenario: Queue is full
- **WHEN** submission returns HTTP `429`
- **THEN** the workspace SHALL show queue-full feedback while preserving the current draft question, options, history, and focused run

### Requirement: Focused run lifecycle is observable and cancellable
The system SHALL show the focused run's full query, applied evidence options, status, stage, branch progress, evidence count, deadline/timestamps, cancellation state, and failure category, and SHALL poll every 1.5 seconds only while that run is non-terminal.

#### Scenario: Focused run is non-terminal
- **WHEN** focused status is queued or running
- **THEN** detail SHALL refetch every 1.5 seconds
- **AND** history SHALL not be polled solely to update focus

#### Scenario: Focused run becomes terminal
- **WHEN** detail reports completed, partial, failed, cancelled, or interrupted
- **THEN** polling SHALL stop and history SHALL refresh

#### Scenario: Request cancellation
- **WHEN** the user activates Cancel on a cancellable run
- **THEN** the frontend SHALL call the run's cancel route and show the returned canonical cancellation state

#### Scenario: Cancellation races with completion
- **WHEN** cancellation returns an already-terminal state
- **THEN** the frontend SHALL accept that state without treating the idempotent race as failure

### Requirement: Run history is newest-first, filtered, and paged
The system SHALL list owned runs newest-first with optional status filtering and server paging, labeling each row with query preview, status, stage, applied evidence options, and timestamps.

#### Scenario: Browse history
- **WHEN** run history spans multiple pages
- **THEN** page controls and totals SHALL come from the server response

#### Scenario: Filter history by status
- **WHEN** the user chooses a status filter
- **THEN** the request and query key SHALL include that filter
- **AND** the displayed total SHALL describe the filtered result set

#### Scenario: Select a history row
- **WHEN** a user selects a row
- **THEN** `runId` SHALL update and owned detail SHALL supply the retained full query when available

### Requirement: Run selection is reload-safe and ownership-safe
The system SHALL support `/advanced-search?runId=...`, clear incompatible run selection when the knowledge base changes or lookup proves non-ownership, and show an explanatory notice without automatically switching knowledge bases.

#### Scenario: Reload owned run
- **WHEN** the page loads with an owned retained `runId`
- **THEN** it SHALL load detail and resume focused polling if non-terminal

#### Scenario: Knowledge base changes
- **WHEN** global knowledge-base selection changes
- **THEN** the workspace SHALL clear run ID, readiness, and scoped history/detail/result selection state
- **AND** SHALL show that the previous run selection was cleared for the new context

#### Scenario: Run is expired or not owned
- **WHEN** detail returns ownership-safe `404`
- **THEN** the workspace SHALL clear invalid `runId`, preserve the draft and history view, and show expired/not-owned feedback

### Requirement: Admission conflicts refresh readiness without losing work
The system SHALL handle readiness-related HTTP `409` by preserving the question/options draft, refetching readiness immediately, displaying machine-readable blockers, and requiring a new submission.

#### Scenario: Readiness changes before admission
- **WHEN** create returns a readiness conflict
- **THEN** the workspace SHALL refresh readiness before and after presenting the conflict
- **AND** SHALL NOT automatically resubmit

#### Scenario: Result is requested before available
- **WHEN** a pre-result request returns `409`
- **THEN** the workspace SHALL retain focused run state and continue lifecycle handling
- **AND** SHALL not erase the draft or history

### Requirement: Terminal runs hand off only valid result statuses
The system SHALL enable result retrieval only when focused status is `COMPLETED` or `PARTIAL` and SHALL preserve lifecycle-only failure presentations for other terminal states.

#### Scenario: Completed or partial run
- **WHEN** focused status is `COMPLETED` or `PARTIAL`
- **THEN** the result resource SHALL become eligible for retrieval

#### Scenario: Failed, cancelled, or interrupted run
- **WHEN** focused status is `FAILED`, `CANCELLED`, or `INTERRUPTED`
- **THEN** result retrieval SHALL remain disabled unless the backend explicitly reports an available result
- **AND** lifecycle/failure context SHALL remain visible
