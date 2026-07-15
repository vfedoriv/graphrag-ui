## ADDED Requirements

### Requirement: Held-out evaluation uses explicit eligible document selection
The system SHALL let users select existing documents owned by the current knowledge base for held-out evaluation, SHALL exclude active document sources from the offered set, and SHALL send the current draft revision with the selection and advisory flag.

#### Scenario: Select held-out documents
- **WHEN** a reviewed open draft has documents that are not active document sources
- **THEN** the system SHALL allow explicit multi-selection of those documents for evaluation
- **AND** SHALL not preselect active draft document sources as held-out evidence

#### Scenario: No held-out documents are available
- **WHEN** every knowledge-base document is already an active draft document source or no documents exist
- **THEN** the system SHALL explain that a separate held-out document is required
- **AND** SHALL disable evaluation start

#### Scenario: Backend rejects an ineligible document
- **WHEN** a selected document contributed evidence under rules not fully derivable by the frontend
- **THEN** the system SHALL retain the user's selection and show the normalized backend eligibility error

### Requirement: Evaluation progress and outcomes are polled from server state
The system SHALL poll active evaluation runs, display aggregate document counts and paged per-document outcomes, and stop polling at `COMPLETED`, `PARTIAL`, `FAILED`, or `INTERRUPTED`.

#### Scenario: Start evaluation
- **WHEN** a user starts evaluation with valid held-out documents
- **THEN** the system SHALL poll the returned run resource while it is `QUEUED` or `RUNNING`

#### Scenario: Evaluation partially completes
- **WHEN** the run becomes `PARTIAL`
- **THEN** the system SHALL show succeeded, failed, and stale document counts and retain successful results

#### Scenario: Evaluation is retried
- **WHEN** a terminal run is retryable and the user confirms retry
- **THEN** the system SHALL send the latest draft revision to the retry endpoint
- **AND** SHALL identify reused outcomes separately from new outcomes

### Requirement: Evaluation distinguishes deterministic and advisory results
The system SHALL present deterministic extraction and validation metrics separately from optional advisory model assessments and SHALL show not-applicable rate values without converting them to zero.

#### Scenario: Deterministic metrics are available
- **WHEN** an evaluation returns recognized-entity, dropped-relationship, key-availability, property-conflict, required-property, low-support, or guidance-support metrics
- **THEN** the system SHALL render their counts, denominators, rates, and evidence coordinates using the documented metric contract

#### Scenario: Advisory assessment is available
- **WHEN** advisory evaluation returns intended-question or schema-noise judgments
- **THEN** the system SHALL label them as advisory model assessments
- **AND** SHALL show reproducibility metadata without styling them as deterministic validation failures

#### Scenario: Metric contract is not documented
- **WHEN** metrics or advisory values are returned only as generic objects
- **THEN** the system SHALL use a clearly labeled structured payload inspector
- **AND** SHALL not invent semantic field labels, formulas, or pass thresholds

### Requirement: Evaluation progress is recoverable after reload
The system SHALL rediscover current and recent evaluation runs from authoritative backend state after navigation or reload.

#### Scenario: Return to a running evaluation
- **WHEN** the selected draft page remounts while evaluation is active
- **THEN** the system SHALL identify the active run and resume polling

#### Scenario: Backend exposes only get by known run ID
- **WHEN** the frontend cannot enumerate or identify the current run
- **THEN** the system SHALL not claim complete evaluation-history or reload recovery support
