## Purpose

This specification defines the required behavior for publishing reviewed schema drafts in the GraphRAG admin UI.

## Requirements

### Requirement: Publication readiness shows every blocker for an exact revision
The system SHALL retrieve publication readiness for the current draft and display its draft revision, aggregate revision, projection content hash, target identity, ready state, and all blocking reasons.

#### Scenario: Draft is not ready
- **WHEN** readiness returns one or more blocking reasons
- **THEN** the system SHALL disable publication and render every blocker with category and detail

#### Scenario: Review state changes
- **WHEN** a decision, conflict resolution, guidance change, source change, analysis, or evaluation changes the draft state
- **THEN** the system SHALL invalidate the prior readiness result before publication can be attempted

#### Scenario: Draft is ready
- **WHEN** readiness returns `ready: true`
- **THEN** the system SHALL show the exact revision and projection hash that will be published

### Requirement: Publishing is explicit and token-bound
The system SHALL require confirmation before publication and SHALL submit exactly the ready draft revision and projection content hash, while explaining that publication creates an inactive schema only.

#### Scenario: Publish a ready draft
- **WHEN** the user confirms publication of a current ready result
- **THEN** the system SHALL submit the readiness revision and content hash
- **AND** SHALL show the returned inactive schema and publication audit identifiers

#### Scenario: Publication token is stale
- **WHEN** the backend rejects publication because the draft revision or projection hash changed
- **THEN** the system SHALL invalidate readiness, reload review state, and require a new explicit publication attempt

#### Scenario: Identical publication is retried
- **WHEN** the backend returns an existing idempotent publication result
- **THEN** the system SHALL render it as the successful publication record without claiming a second schema was created

### Requirement: Publication audit and drift remain visible
The system SHALL show publication ID, schema ID, publication draft revision, publication content hash, current registered-schema hash, active state, publication time, and content-drift state for a published draft.

#### Scenario: Published schema content has drifted
- **WHEN** the current schema content hash differs from the publication content hash
- **THEN** the system SHALL prominently identify that the registered schema no longer exactly matches the reviewed publication snapshot

#### Scenario: Open a published draft
- **WHEN** a draft status is `PUBLISHED`
- **THEN** the system SHALL retain evaluation, readiness, projection, decision, conflict, and publication history as read-only views

### Requirement: Publication, activation, and reprocessing remain separate
The system SHALL present publication, activation, and reprocessing as separate actions with separate status and confirmation feedback.

#### Scenario: Publication succeeds
- **WHEN** a draft is published successfully
- **THEN** the system SHALL not report the schema as active unless active-schema state confirms it
- **AND** SHALL not start a reprocessing plan

### Requirement: Release workbench pagination identifies item totals
The system SHALL identify every total displayed by a Release workbench pager as a total number of items while preserving the existing page numbering and navigation behavior.

#### Scenario: Describe release workbench totals explicitly
- **WHEN** an eligibility, evaluation outcome, evaluation history, reprocessing plan item, or reprocessing plan history pager is displayed for any page and total count
- **THEN** the system SHALL render `Page <current page> · <count> items total`
- **AND** SHALL use the complete item count for the corresponding paged result as `<count>`

### Requirement: Release choices keep indicators adjacent to their labels
The system SHALL render checkbox and radio choices in the Release workflow as compact, left-aligned controls, with each native indicator adjacent to its visible label, while preserving semantic label association and existing choice behavior.

#### Scenario: Advisory assessment choice is displayed
- **WHEN** the held-out evaluation stage renders the optional advisory model assessment choice
- **THEN** the checkbox indicator SHALL be left-aligned and adjacent to the `Include advisory model assessment` label
- **AND** selecting the label or checkbox SHALL toggle the advisory option

#### Scenario: Release workflow is viewed at different widths or themes
- **WHEN** a Release checkbox or radio choice is displayed at any supported responsive width or in either supported theme
- **THEN** the indicator and label SHALL remain a visually unified choice without stretching the indicator across the available panel width
