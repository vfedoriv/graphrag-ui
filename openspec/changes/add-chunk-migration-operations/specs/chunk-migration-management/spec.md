## ADDED Requirements

### Requirement: Every migration scope requires a current preview
The system SHALL require a side-effect-free backend preview matching the current knowledge base, selection, document IDs, processing options, and preview page before enabling chunk-migration plan creation.

#### Scenario: Preview outdated strategy scope
- **WHEN** the user opens Reprocessing or chooses the primary migration action
- **THEN** the default selection SHALL be `OUTDATED_STRATEGY`
- **AND** the frontend SHALL preview through `/knowledge-bases/{knowledgeBaseId}/chunk-migrations/preview`

#### Scenario: Preview selected documents
- **WHEN** the user chooses `DOCUMENT_IDS`
- **THEN** the frontend SHALL require at least one owned document ID and include only those IDs in the preview body

#### Scenario: Preview forced all
- **WHEN** the user chooses `ALL`
- **THEN** the frontend SHALL preview the forced-all selection without supplying document IDs

#### Scenario: Preview inputs change
- **WHEN** selection, document IDs, processing options, or knowledge base changes after preview
- **THEN** the previous preview SHALL become invalid for creation
- **AND** a new preview SHALL be required

#### Scenario: Preview is requested
- **WHEN** a preview succeeds or fails
- **THEN** no plan, item, processing run, chunk, or graph work SHALL be represented as created

### Requirement: Migration preview explains readiness and selection
The system SHALL render preview readiness, stable blockers, the active target, expected chunker revision, whole-knowledge-base classification counts, selected count, and the server-paged selected-document classifications.

#### Scenario: Preview is ready
- **WHEN** the backend returns `ready: true`
- **THEN** the UI SHALL show schema/content hash, AI profile/revision, embedding space, expected chunker revision, `noChunks`/`outdated`/`current` totals, selected count, and paged selected documents

#### Scenario: Preview is blocked
- **WHEN** preview contains `ACTIVE_SCHEMA_MISSING`, `AI_PROFILE_UNRESOLVABLE`, `EMBEDDING_SPACE_INCOMPATIBLE`, `INVALID_MIGRATION_TARGET`, or `ACTIVE_DESTRUCTIVE_PLAN`
- **THEN** creation SHALL remain disabled
- **AND** each blocker SHALL be presented with its backend message and an actionable category

#### Scenario: Browse selected classifications
- **WHEN** selected-document results span multiple pages
- **THEN** the frontend SHALL request and display server pages and totals without materializing all selected documents

### Requirement: Riskier scopes require deliberate confirmation
The system SHALL keep `DOCUMENT_IDS` and `ALL` behind advanced scope controls and SHALL require an in-app confirmation dialog with current preview details before forced-all migration creation.

#### Scenario: Create outdated-only migration
- **WHEN** a ready current `OUTDATED_STRATEGY` preview has selected work and the user confirms creation
- **THEN** the system SHALL submit reason `CHUNK_STRATEGY_MIGRATION`, selection, processing options, and the preview target's expected chunker revision

#### Scenario: Confirm forced-all migration
- **WHEN** the user attempts to create from an `ALL` preview
- **THEN** an in-app dialog SHALL show selected count, classification totals, target schema/profile/embedding identity, expected revision, and that current documents will also be rebuilt
- **AND** no request SHALL be sent until the user confirms that dialog

#### Scenario: Forced-all preview changes while dialog is open
- **WHEN** the preview identity or scope draft changes before confirmation
- **THEN** the dialog confirmation SHALL become invalid and a new preview/confirmation SHALL be required

#### Scenario: Submit selected-document migration
- **WHEN** a ready `DOCUMENT_IDS` preview is confirmed
- **THEN** creation SHALL include the previewed document IDs
- **AND** other selections SHALL omit document IDs

### Requirement: Admission conflicts require fresh preview and confirmation
The system SHALL treat migration creation HTTP `409` as stale readiness or target state, preserve the user's scope draft, refetch preview, explain the change, and require a new confirmation.

#### Scenario: Target changes before creation
- **WHEN** plan creation returns `409`
- **THEN** the frontend SHALL invalidate preview and migration history, request a fresh preview, and SHALL NOT automatically retry creation

#### Scenario: Fresh preview differs
- **WHEN** the replacement preview has different readiness, blockers, target, revision, counts, or selected documents
- **THEN** the user SHALL see the changed state and explicitly confirm again

#### Scenario: Determine readiness
- **WHEN** enabling or retrying migration creation
- **THEN** the frontend SHALL use migration preview readiness
- **AND** SHALL NOT infer readiness by combining separate settings, profile, schema, or document requests

### Requirement: Migration history is server-filtered and auditable
The system SHALL request migration history with `reason=CHUNK_STRATEGY_MIGRATION`, support optional server-side selection and status filters, and use the filtered response's totals and pages.

#### Scenario: Load migration history
- **WHEN** Reprocessing history opens
- **THEN** each row SHALL show reason, selection, expected target revision, status, progress, target currency, retryability, retry lineage, and creation time

#### Scenario: Apply history filters
- **WHEN** the user changes selection or status filter
- **THEN** the list request and query key SHALL include the filter
- **AND** displayed totals SHALL describe only the server-filtered migration set

#### Scenario: Select a deep-linked plan
- **WHEN** `/chunking?view=migrations&planId=...` identifies an owned plan
- **THEN** the frontend SHALL load that plan and its current paged items after reload

### Requirement: Active migration progress and outcomes remain understandable
The system SHALL poll the selected queued or running plan, page its items, stop polling at terminal state, and distinguish failure from source and target safety stops.

#### Scenario: Plan is active
- **WHEN** selected status is `QUEUED` or `RUNNING`
- **THEN** the frontend SHALL display aggregate progress and continue focused-plan polling

#### Scenario: Item is stale
- **WHEN** an item status is `STALE_SOURCE`
- **THEN** the UI SHALL explain that the source document changed after snapshot and was not processed under the stale snapshot

#### Scenario: Item is blocked
- **WHEN** an item status is `BLOCKED`
- **THEN** the UI SHALL explain the reported safety blocker separately from a processing failure

#### Scenario: Target changed
- **WHEN** an item status is `BLOCKED_TARGET_CHANGED`
- **THEN** the UI SHALL explain that the snapshotted chunk/profile/embedding/schema target changed
- **AND** SHALL preserve successful-item progress

### Requirement: Retry resnapshots only unresolved work
The system SHALL expose Retry only for retryable terminal migration plans and SHALL require an in-app confirmation dialog before sending `{ "mode": "RESNAPSHOT_UNRESOLVED" }`.

#### Scenario: Confirm retry
- **WHEN** the user activates Retry on an eligible plan
- **THEN** the dialog SHALL explain that prior successes remain and unresolved documents are resnapshotted under the current target
- **AND** no retry request SHALL be sent until confirmed

#### Scenario: Retry request is sent
- **WHEN** the user confirms the current retry dialog
- **THEN** the body SHALL contain only `mode: RESNAPSHOT_UNRESOLVED`
- **AND** the new plan SHALL become selected with its retry lineage visible

#### Scenario: Retry is ineligible
- **WHEN** a plan is active, non-retryable, or lacks unresolved eligible work
- **THEN** the UI SHALL not enable Retry

### Requirement: Migration deep links follow selected knowledge-base ownership
The system SHALL clear an incompatible or not-owned `planId` when the global knowledge base changes or ownership-safe plan lookup fails, preserve the selected knowledge base, and show an explanatory notice.

#### Scenario: Knowledge base changes with selected plan
- **WHEN** the user changes the global knowledge base
- **THEN** the workspace SHALL clear `planId`, preview state, scope-specific selections, and scoped plan caches
- **AND** SHALL show that the prior migration selection belonged to another context

#### Scenario: Deep-linked plan is not owned
- **WHEN** selected-plan lookup returns ownership-safe `404`
- **THEN** the workspace SHALL clear the invalid plan ID without searching or switching knowledge bases
