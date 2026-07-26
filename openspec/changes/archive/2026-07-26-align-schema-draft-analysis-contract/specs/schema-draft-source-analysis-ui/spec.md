## ADDED Requirements

### Requirement: Analysis contracts preserve current and legacy run metadata
The system SHALL validate analysis detail, history summaries, and nested source outcomes against the expanded backend contract, including `failureCode`, effective execution budgets, persisted failure retryability, and current retry-command eligibility.

#### Scenario: Parse a current analysis run
- **WHEN** analysis detail or history includes effective source concurrency, source timeout, request timeout, `retryable`, and `canRetry`
- **THEN** the system SHALL retain every field in the typed result
- **AND** SHALL NOT reject the response as an unexpected shape

#### Scenario: Parse a legacy analysis run
- **WHEN** an analysis run created before execution-policy persistence returns null effective concurrency or timeout fields
- **THEN** the system SHALL retain those fields as null
- **AND** SHALL NOT fabricate execution-budget values from current runtime settings

#### Scenario: Parse a detailed source failure
- **WHEN** a source outcome includes a broad failure category and a nullable stable failure code
- **THEN** the system SHALL retain both values independently
- **AND** SHALL accept null failure codes for legacy source outcomes

### Requirement: Analysis diagnostics explain captured execution and failure state
The system SHALL show each selected run's captured execution concurrency and timeout budgets and SHALL show each failed source's broad category, detailed failure code, and persisted retryability without exposing source content or provider-sensitive details.

#### Scenario: Inspect current execution budgets
- **WHEN** the selected analysis run has non-null effective concurrency and timeout fields
- **THEN** the system SHALL show the captured source concurrency, source timeout, and request timeout using human-readable labels and duration formatting
- **AND** SHALL explain that the values were captured for that run

#### Scenario: Inspect legacy execution budgets
- **WHEN** one or more effective execution-budget fields are null
- **THEN** the system SHALL identify the unavailable values as legacy metadata
- **AND** SHALL NOT substitute values from the live runtime-settings catalog

#### Scenario: Inspect a deadline failure
- **WHEN** a source outcome reports `SOURCE_DEADLINE_EXCEEDED` or `REQUEST_DEADLINE_EXCEEDED`
- **THEN** the system SHALL show the detailed deadline code alongside the broad failure category
- **AND** SHALL show the source outcome's persisted retryability

#### Scenario: Inspect a legacy source failure
- **WHEN** a failed source outcome has a broad failure category and null failure code
- **THEN** the system SHALL continue to show the broad category
- **AND** SHALL identify the detailed code as unavailable rather than inventing one

## MODIFIED Requirements

### Requirement: Analysis is a durable polled workflow
The system SHALL start analysis with the current draft revision, poll the authoritative run resource while it is active, display aggregate progress and nested paged `sourceOutcomes`, and stop polling at a terminal state.

#### Scenario: Start analysis
- **WHEN** an open draft has analyzable active sources and no analysis is currently running
- **THEN** the system SHALL send the current draft revision
- **AND** SHALL poll the returned run location while status is `RUNNING`

#### Scenario: Inspect history while analysis is running
- **WHEN** the user selects a historical terminal run while another analysis for the draft remains active
- **THEN** the system SHALL keep the general Start analysis action unavailable
- **AND** SHALL continue to represent the active workflow independently from the selected historical run

#### Scenario: Analysis completes
- **WHEN** a run becomes `COMPLETED`
- **THEN** the system SHALL stop polling and refresh draft detail, candidates, conflicts, projection, and diff

#### Scenario: Analysis partially completes
- **WHEN** a run becomes `PARTIAL`
- **THEN** the system SHALL show succeeded and failed source counts and each source outcome from the nested `page`, `size`, `totalElements`, and `content` envelope
- **AND** SHALL keep any returned aggregate available for review

#### Scenario: Analysis fails
- **WHEN** a run becomes `FAILED`
- **THEN** the system SHALL show its privacy-safe failure category and persisted failure retryability without inventing model or source content
- **AND** SHALL represent retry-command availability separately

#### Scenario: Start is rejected after state changes
- **WHEN** the backend rejects an analysis start because the draft revision, active workflow, or capacity changed after rendering
- **THEN** the system SHALL show the normalized backend error
- **AND** SHALL refresh authoritative draft and analysis state where applicable

### Requirement: Analysis progress survives navigation and reload
The system SHALL restore current analysis progress from the draft's workflow reference, expose paged recent run history, and never depend on route-local mutation state or a browser-retained run identifier for correctness.

#### Scenario: Return while analysis is running
- **WHEN** the page remounts while a draft analysis is active
- **THEN** the system SHALL follow `currentAnalysis.statusLocation` and resume polling it

#### Scenario: Inspect analysis history
- **WHEN** the user opens analysis history
- **THEN** the system SHALL load the paged analysis-run list ordered by backend history semantics
- **AND** SHALL show each run's currentness, persisted retryability, current retry-command eligibility, retry lineage, captured execution budgets, aggregate, counts, timestamps, and status location

#### Scenario: Latest run is not current
- **WHEN** source membership, guidance, or draft state makes a historical run stale
- **THEN** the system SHALL keep the run inspectable
- **AND** SHALL not treat recency alone as proof that its result is current

### Requirement: Retry preserves backend reuse semantics
The system SHALL use `canRetry` as the authoritative response hint for displaying a retry action, SHALL use `retryable` only as persisted failure classification, and SHALL bind retry requests to the latest reviewed draft revision.

#### Scenario: Retryable failure is currently eligible
- **WHEN** a terminal run reports `retryable=true` and `canRetry=true` and the user requests retry
- **THEN** the system SHALL call the run retry endpoint with the current draft revision
- **AND** SHALL present reused successful source outcomes separately from newly executed outcomes

#### Scenario: Permanent failure permits explicit reanalysis
- **WHEN** a terminal run reports `retryable=false` and `canRetry=true`
- **THEN** the system SHALL offer the retry action
- **AND** SHALL continue to describe the prior failure as non-retryable

#### Scenario: Retryable failure is currently ineligible
- **WHEN** a terminal run reports `retryable=true` and `canRetry=false`
- **THEN** the system SHALL not offer an enabled retry action
- **AND** SHALL continue to show that the prior failure classification was retryable

#### Scenario: Retry eligibility changes after rendering
- **WHEN** the backend rejects a retry because draft state, active sources, another analysis, revision, or capacity changed after `canRetry` was read
- **THEN** the system SHALL show the normalized backend error
- **AND** SHALL refresh authoritative draft, history, and selected-run state
