## MODIFIED Requirements

### Requirement: Plan progress and safety outcomes are observable
The system SHALL poll queued or running plans, display aggregate counts, paginate `items` through the nested standard page envelope, and distinguish succeeded, failed, stale, blocked, target-changed, interrupted, and skipped outcomes.

#### Scenario: Plan is running
- **WHEN** a plan status is `QUEUED` or `RUNNING`
- **THEN** the system SHALL show total, queued, running, succeeded, failed, stale, and blocked counts and continue polling
- **AND** SHALL navigate item results using `items.page`, `items.size`, `items.totalElements`, and `items.content`

#### Scenario: Active schema changes during a plan
- **WHEN** item outcomes become `BLOCKED` because the published schema is no longer active
- **THEN** the system SHALL identify the active-schema safety stop and SHALL not describe blocked items as processed failures

#### Scenario: Migration target changes during a plan
- **WHEN** an item becomes `BLOCKED_TARGET_CHANGED`
- **THEN** the shared plan contract and presentation SHALL identify a snapshotted chunk/profile/embedding/schema target safety stop
- **AND** SHALL preserve independently completed items

#### Scenario: Document changed after snapshot
- **WHEN** an item becomes `STALE_SOURCE`
- **THEN** the system SHALL identify the changed document and explain that it was not processed under the old snapshot

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
