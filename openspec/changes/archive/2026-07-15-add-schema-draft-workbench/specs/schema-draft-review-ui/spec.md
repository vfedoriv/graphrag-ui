## ADDED Requirements

### Requirement: Candidates are reviewed with evidence and independent state dimensions
The system SHALL present paged typed draft candidates with kind, canonical identity, coordinates, support count, confidence, evidence origins, evidence references, analyzer recommendation state, effective persistent review state, and latest decision linkage without treating confidence, origin, or recommendation as user approval.

#### Scenario: Inspect a candidate
- **WHEN** a user expands a candidate row
- **THEN** the system SHALL show its observed, guided, inferred, or existing origins and source/chunk evidence metadata
- **AND** SHALL label `recommendationState` separately from `effectiveReviewState`
- **AND** SHALL not expose source text that the backend did not return

#### Scenario: Candidate has a persisted decision
- **WHEN** a candidate response includes an effective review state and latest decision ID
- **THEN** the system SHALL display the persistent state and link it to decision history
- **AND** SHALL retain the independent analyzer recommendation

#### Scenario: Candidate response has an unexpected shape
- **WHEN** the persistent candidate payload does not match the documented candidate page contract
- **THEN** the system SHALL show a contract error and disable decision actions for that payload

### Requirement: Candidate decisions are explicit revision-aware events
The system SHALL support accept, reject, modify, and pin decisions using the current draft revision and SHALL refresh the draft revision and affected review results after every successful decision.

#### Scenario: Accept or reject a candidate
- **WHEN** a user confirms Accept or Reject for a candidate
- **THEN** the system SHALL submit the candidate identity, decision type, current revision, and optional rationale
- **AND** SHALL render the returned decision in decision history

#### Scenario: Modify or pin a candidate
- **WHEN** a user chooses Modify or Pin
- **THEN** the system SHALL open a structured value editor seeded with the candidate
- **AND** SHALL require the result to preserve the candidate identity and kind before submission

#### Scenario: Decision conflicts with a newer revision
- **WHEN** the backend rejects a decision with HTTP 409
- **THEN** the system SHALL refetch the candidate and draft state
- **AND** SHALL require the user to review and resubmit rather than replaying automatically

### Requirement: Conflicts require explicit resolution
The system SHALL list draft conflicts with type, coordinate, alternatives, evidence, and resolution state and SHALL require exactly one valid alternative or one custom structured resolution.

#### Scenario: Resolve with an existing alternative
- **WHEN** the user selects one backend-provided alternative and confirms
- **THEN** the system SHALL submit that alternative with the current draft revision
- **AND** SHALL refresh conflicts, projection, diff, readiness-related state, and draft revision

#### Scenario: Resolve with a custom value
- **WHEN** the user supplies a custom resolution instead of selecting an alternative
- **THEN** the system SHALL submit the structured custom value and optional rationale
- **AND** SHALL not also submit a selected alternative

### Requirement: Effective projection is inspectable but not directly replaceable
The system SHALL render the backend effective projection in readable and structured JSON views with aggregate and draft revision context, and SHALL direct edits through decisions and conflict resolutions.

#### Scenario: View current projection
- **WHEN** a current aggregate exists
- **THEN** the system SHALL show the projected schema and whether draft-review preconditions are currently satisfied

#### Scenario: No current aggregate exists
- **WHEN** the draft has not produced a current aggregate
- **THEN** the system SHALL prompt the user to add sources and run analysis instead of showing an empty editable schema

### Requirement: Compatibility diffs explain schema evolution
The system SHALL render stable diff items with coordinate, operation, before and after values, and `ADDITIVE`, `REVIEW_REQUIRED`, or `BREAKING` compatibility, with filtering by compatibility and operation.

#### Scenario: Inspect a breaking change
- **WHEN** a diff item is classified as `BREAKING`
- **THEN** the system SHALL visually distinguish it and show both before and after values

#### Scenario: Reanalysis changes the aggregate
- **WHEN** a new current aggregate replaces the prior aggregate
- **THEN** the system SHALL invalidate and reload candidate, conflict, projection, and diff views while retaining backend decision history

### Requirement: Review views use scalable disclosure
The system SHALL paginate candidate data, collapse detailed evidence by default, and avoid rendering all candidate evidence and diff payloads eagerly.

#### Scenario: Candidate result spans multiple pages
- **WHEN** the candidate count exceeds the requested page size
- **THEN** the system SHALL expose page navigation with stable query keys and retain prior page data during navigation
