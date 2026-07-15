## ADDED Requirements

### Requirement: Schema drafts are managed in a knowledge-base-scoped workbench
The system SHALL provide a dedicated Schema Drafts page that lists drafts owned by the selected knowledge base and SHALL keep draft planning resources visually distinct from registered schemas.

#### Scenario: Open Schema Drafts with a selected knowledge base
- **WHEN** a user navigates to Schema Drafts while a knowledge base is selected
- **THEN** the system SHALL list that knowledge base's drafts with target name, target version, status, revision, update time, base-schema context, and publication context

#### Scenario: Open Schema Drafts without a selected knowledge base
- **WHEN** no knowledge base is selected
- **THEN** the system SHALL show an informational empty state
- **AND** SHALL NOT call a schema-draft endpoint with a null or placeholder knowledge base identifier

#### Scenario: Selected knowledge base changes
- **WHEN** the user changes the global knowledge-base selection while viewing a draft owned by the prior knowledge base
- **THEN** the system SHALL clear the incompatible draft detail context and load the new knowledge base's draft list

### Requirement: Users can create and revise open drafts
The system SHALL allow creating an open draft with target name and version, optional associated base schema, and structured guidance, and SHALL submit later target or guidance mutations with the current backend draft revision.

#### Scenario: Create a draft
- **WHEN** a user supplies a target name and version, optional owned base schema, and valid structured guidance
- **THEN** the system SHALL create the draft under the selected knowledge base
- **AND** SHALL refresh the draft list and open the returned draft

#### Scenario: Choose a base schema
- **WHEN** the user configures an optional base schema
- **THEN** the system SHALL select it from schemas associated with the current knowledge base
- **AND** SHALL explain that the target name must match and target version must be greater

#### Scenario: Update draft identity
- **WHEN** a user changes the target name or target version of an open draft
- **THEN** the system SHALL send the cached current revision with the update
- **AND** SHALL adopt the revision returned by the successful mutation before enabling another revision-bearing action

### Requirement: Structured guidance can be round-tripped safely
The system SHALL render and edit the complete canonical guidance value returned for an existing draft, including domain description, intended questions, required, preferred, and excluded concepts, naming rules, property rules, relationship rules, and additional instructions, and SHALL preserve its revision and fingerprint metadata.

#### Scenario: Reopen an existing draft
- **WHEN** a user opens a draft that already has guidance
- **THEN** the system SHALL load the authoritative typed guidance envelope and populate the guidance editor
- **AND** SHALL keep additional instructions distinct from structured discovery guidance

#### Scenario: Save guidance
- **WHEN** the user submits changed structured guidance for an open draft
- **THEN** the system SHALL send the current draft revision and preserve the edited input until the request succeeds

### Requirement: Draft lists and details expose workflow navigation
The system SHALL use nullable current-analysis, latest-evaluation, and latest-reprocessing references returned with draft list and detail responses to orient users without loading outcome collections eagerly.

#### Scenario: Draft has active or historical workflow state
- **WHEN** a draft response contains workflow references
- **THEN** the system SHALL show their statuses and current/latest semantics
- **AND** SHALL use their status locations to open or resume the corresponding resource

#### Scenario: Workflow reference is stale
- **WHEN** the latest evaluation is not current or the latest reprocessing target is not current
- **THEN** the system SHALL retain the historical reference
- **AND** SHALL label it as stale rather than presenting it as applicable current state

### Requirement: Optimistic-concurrency conflicts preserve user work
The system SHALL surface stale-revision conflicts as a distinct recoverable state, refresh authoritative draft resources, and preserve unsent form values or pending selections for user-directed retry.

#### Scenario: Mutation uses a stale revision
- **WHEN** the backend returns HTTP 409 for a draft mutation
- **THEN** the system SHALL explain that the draft changed
- **AND** SHALL refetch the affected draft resources
- **AND** SHALL NOT discard the user's unsent values or automatically replay a semantic mutation

### Requirement: Published drafts are read-only audit resources
The system SHALL disable lifecycle, guidance, source, decision, and conflict mutations for drafts whose status is `PUBLISHED`, while keeping their evidence, decisions, projection, diff, and publication metadata inspectable.

#### Scenario: Open a published draft
- **WHEN** draft detail reports status `PUBLISHED`
- **THEN** the system SHALL identify the draft as a read-only audit record
- **AND** SHALL not render its mutation controls as actionable

### Requirement: Open drafts can be deleted deliberately
The system SHALL require confirmation before deleting an open draft, include its current revision in the request, and refresh list/detail state only after successful deletion.

#### Scenario: Delete an open draft
- **WHEN** a user confirms deletion of an open draft and the backend succeeds
- **THEN** the system SHALL remove the draft detail context and refresh the knowledge-base draft list

#### Scenario: Delete is rejected
- **WHEN** draft deletion is rejected because the revision is stale or analysis is running
- **THEN** the system SHALL retain the draft in the UI and show the normalized backend problem detail
