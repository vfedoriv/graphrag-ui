## ADDED Requirements

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
The system SHALL poll queued or running plans, display aggregate counts, paginate plan items, and distinguish succeeded, failed, stale, blocked, interrupted, and skipped outcomes.

#### Scenario: Plan is running
- **WHEN** a plan status is `QUEUED` or `RUNNING`
- **THEN** the system SHALL show total, queued, running, succeeded, failed, stale, and blocked counts and continue polling

#### Scenario: Active schema changes during a plan
- **WHEN** item outcomes become `BLOCKED` because the published schema is no longer active
- **THEN** the system SHALL identify the active-schema safety stop and SHALL not describe blocked items as processed failures

#### Scenario: Document changed after snapshot
- **WHEN** an item becomes `STALE_SOURCE`
- **THEN** the system SHALL identify the changed document and explain that it was not processed under the old snapshot

### Requirement: Plan retry makes resnapshot behavior explicit
The system SHALL allow retry for retryable terminal plans and SHALL require the user to choose whether unresolved documents are resnapshotted.

#### Scenario: Retry without resnapshot
- **WHEN** the user retries and does not allow resnapshotting
- **THEN** the system SHALL send `resnapshotUnresolvedDocuments: false` and explain that changed snapshots remain unresolved

#### Scenario: Retry with resnapshot
- **WHEN** the user explicitly allows unresolved documents to be resnapshotted
- **THEN** the system SHALL send `resnapshotUnresolvedDocuments: true`
- **AND** SHALL show the new plan's retry lineage separately from prior successful items

### Requirement: Plan progress is recoverable after reload
The system SHALL rediscover active and recent reprocessing plans from authoritative backend state after navigation or reload.

#### Scenario: Return to a running plan
- **WHEN** the selected draft page remounts while a plan is active
- **THEN** the system SHALL identify the active plan and resume polling its paged status

#### Scenario: Backend exposes only get by known plan ID
- **WHEN** the frontend cannot enumerate or identify current plans
- **THEN** the system SHALL not claim complete plan-history or reload recovery support
