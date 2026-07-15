## ADDED Requirements

### Requirement: Held-out evaluation uses explicit eligible document selection
The system SHALL load a paged backend eligibility resource for documents owned by the current knowledge base, SHALL allow selection only of rows marked eligible, and SHALL send the authoritative current draft revision with the selection and advisory flag.

#### Scenario: Select held-out documents
- **WHEN** the eligibility page contains documents marked `eligible: true`
- **THEN** the system SHALL allow explicit multi-selection of those documents for evaluation
- **AND** SHALL retain the page's draft revision and current aggregate ID as the eligibility snapshot

#### Scenario: No held-out documents are available
- **WHEN** no returned document is eligible or no documents exist
- **THEN** the system SHALL explain that a separate held-out document is required
- **AND** SHALL disable evaluation start

#### Scenario: Document contributed active discovery evidence
- **WHEN** a document row is ineligible with reason `ACTIVE_DISCOVERY_EVIDENCE`
- **THEN** the system SHALL disable its selection and explain that it contributed to the current aggregate

#### Scenario: Eligibility snapshot becomes stale
- **WHEN** the draft revision or current aggregate changes after eligibility was loaded
- **THEN** the system SHALL invalidate the eligibility page and disable evaluation start until refreshed

### Requirement: Evaluation progress and outcomes are polled from server state
The system SHALL poll active evaluation runs, display aggregate document counts and per-document outcomes from the nested standard page envelope, and stop polling at `COMPLETED`, `PARTIAL`, `FAILED`, or `INTERRUPTED`.

#### Scenario: Start evaluation
- **WHEN** a user starts evaluation with valid held-out documents
- **THEN** the system SHALL poll the returned run resource while it is `QUEUED` or `RUNNING`

#### Scenario: Evaluation partially completes
- **WHEN** the run becomes `PARTIAL`
- **THEN** the system SHALL show succeeded, failed, and stale document counts and retain successful results from `outcomes.content`
- **AND** SHALL paginate using `outcomes.page`, `outcomes.size`, and `outcomes.totalElements`

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

#### Scenario: Advisory execution does not produce model judgment
- **WHEN** advisory status is `NOT_REQUESTED`, `COMPLETED_WITHOUT_MODEL_JUDGMENT`, or `FAILED`
- **THEN** the system SHALL render that explicit execution state with returned reasons and warnings
- **AND** SHALL keep deterministic metrics available and visually independent

#### Scenario: Historical version-one evaluation is opened
- **WHEN** a typed evaluation response retains contract revision `schema-draft-evaluation-v1`
- **THEN** the system SHALL identify it as a legacy result
- **AND** SHALL treat empty adapted evidence or reason collections as unavailable historical detail rather than proof of absence

### Requirement: Evaluation progress is recoverable after reload
The system SHALL rediscover the latest evaluation from the draft workflow reference and expose paged authoritative evaluation history after navigation or reload.

#### Scenario: Return to a running evaluation
- **WHEN** the selected draft page remounts while evaluation is active
- **THEN** the system SHALL follow the latest-evaluation status location and resume polling

#### Scenario: Inspect evaluation history
- **WHEN** the user opens evaluation history
- **THEN** the system SHALL load the paged run list and show currentness, retryability, retry lineage, counts, reproducibility identifiers, timestamps, and status locations

#### Scenario: Latest evaluation is stale
- **WHEN** the draft reference or run summary reports `current: false`
- **THEN** the system SHALL retain the run for audit
- **AND** SHALL not present its result as current publication evidence
