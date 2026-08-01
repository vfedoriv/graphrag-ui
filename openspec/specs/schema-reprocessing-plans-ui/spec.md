## Purpose

This specification defines the required behavior for creating and monitoring schema-driven document reprocessing plans in the GraphRAG admin UI.

## Requirements

### Requirement: Reprocessing is available only after explicit activation
The system SHALL enable reprocessing-plan creation only when the draft's published schema is currently active for the selected knowledge base.

#### Scenario: Published schema is inactive
- **WHEN** publication succeeded but another schema remains active or no schema is active
- **THEN** the system SHALL disable plan creation and direct the user to the separate activation step

#### Scenario: Published schema is active
- **WHEN** active-schema state matches the published schema ID
- **THEN** the system SHALL enable reprocessing scope and processing-option controls

### Requirement: Plan scope is explicit
The system SHALL require either all eligible documents or an explicit document selection, include the published draft and schema identifiers, and support the existing processing-option payload shape.

#### Scenario: Reprocess all eligible documents
- **WHEN** the user selects all-document scope and confirms creation
- **THEN** the system SHALL send `allDocuments: true` without an explicit document selection

#### Scenario: Reprocess selected documents
- **WHEN** the user selects explicit document scope
- **THEN** the system SHALL require at least one owned document ID and send `allDocuments: false`

#### Scenario: Supply processing options
- **WHEN** the user overrides supported document processing options
- **THEN** the system SHALL send those values in the plan `processingOptions` object using the existing option semantics

### Requirement: Plan progress and safety outcomes are observable
The system SHALL poll queued or running plans, display aggregate counts, paginate `items` through the nested standard page envelope, and distinguish succeeded, failed, stale, blocked, target-changed, interrupted, and skipped outcomes.

#### Scenario: Plan is running
- **WHEN** a plan status is `QUEUED` or `RUNNING`
- **THEN** the system SHALL show total, queued, running, succeeded, failed, stale, and blocked counts and continue polling
- **AND** SHALL navigate item results using `items.page`, `items.size`, `items.totalElements`, and `items.content`

#### Scenario: Active schema changes during a plan
- **WHEN** item outcomes become `BLOCKED` because the published schema is no longer active
- **THEN** the system SHALL identify the active-schema safety stop and SHALL not describe blocked items as processed failures

#### Scenario: Document changed after snapshot
- **WHEN** an item becomes `STALE_SOURCE`
- **THEN** the system SHALL identify the changed document and explain that it was not processed under the old snapshot

#### Scenario: Migration target changes during a plan
- **WHEN** an item becomes `BLOCKED_TARGET_CHANGED`
- **THEN** the shared plan contract and presentation SHALL identify a snapshotted chunk/profile/embedding/schema target safety stop
- **AND** SHALL preserve independently completed items

### Requirement: Plan retry makes resnapshot behavior explicit
The system SHALL allow retry only for retryable terminal plans and SHALL resnapshot unresolved documents through the backend's closed `RESNAPSHOT_UNRESOLVED` retry mode while preserving prior successes.

#### Scenario: Retry is not eligible
- **WHEN** a plan is non-terminal or the backend reports `retryable: false`
- **THEN** the system SHALL NOT enable the retry action

#### Scenario: Retry eligible unresolved work
- **WHEN** the user explicitly confirms retry for a retryable terminal plan
- **THEN** the system SHALL send `{ "mode": "RESNAPSHOT_UNRESOLVED" }`
- **AND** SHALL show the new plan's retry lineage separately from prior successful items

#### Scenario: Deprecated retry compatibility field
- **WHEN** the frontend constructs a retry request
- **THEN** it SHALL NOT send `resnapshotUnresolvedDocuments`

### Requirement: Plan progress is recoverable after reload
The system SHALL rediscover the latest reprocessing plan from the draft workflow reference and expose knowledge-base plan history filtered by the owned draft after navigation or reload.

#### Scenario: Return to a running plan
- **WHEN** the selected draft page remounts while a plan is active
- **THEN** the system SHALL follow the latest-reprocessing status location and resume polling its paged status

#### Scenario: Inspect plan history
- **WHEN** the user opens reprocessing history for a draft
- **THEN** the system SHALL request the paged knowledge-base plan list filtered by that draft ID
- **AND** SHALL show latest, target-current, retryable, retry-lineage, aggregate-count, timestamp, and status-location fields

#### Scenario: Historical plan target is no longer current
- **WHEN** a plan summary reports `targetCurrent: false`
- **THEN** the system SHALL retain the plan for audit and explain that its schema target is no longer current
- **AND** SHALL enable retry only when the backend summary reports it as retryable
