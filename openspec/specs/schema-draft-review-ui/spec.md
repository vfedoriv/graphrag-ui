# schema-draft-review-ui Specification

## Purpose
TBD - created by archiving change add-schema-draft-workbench. Update Purpose after archive.
## Requirements
### Requirement: Candidates are reviewed with evidence and independent state dimensions
The system SHALL present paged typed draft candidates as compact, human-readable review items with kind, canonical identity, normalized coordinates, support count, confidence, evidence origins, evidence references, analyzer recommendation state, effective persistent review state, and latest decision linkage without treating confidence, origin, or recommendation as user approval.

#### Scenario: Scan a collapsed candidate
- **WHEN** a candidate row is collapsed
- **THEN** the system SHALL describe the proposed schema element using its kind-specific coordinates rather than using the canonical identity as the primary label
- **AND** SHALL show its candidate kind in user-facing language
- **AND** SHALL show its analyzer recommendation and effective persistent review state as distinct signals
- **AND** SHALL show its origin, independent-source support count, and analyzer confidence without requiring expansion

#### Scenario: Describe independent-source support
- **WHEN** a candidate has a positive `supportCount`
- **THEN** the system SHALL describe the count as independent supporting sources with correct singular or plural wording
- **AND** SHALL not describe multiple evidence chunks from the same source document as separate support

#### Scenario: Candidate has no observed source support
- **WHEN** a candidate has `supportCount` equal to zero
- **THEN** the system SHALL state that the candidate has no observed source support
- **AND** SHALL retain any guided, inferred, or existing origin that explains why the candidate is present

#### Scenario: Inspect a candidate
- **WHEN** a user expands a candidate row
- **THEN** the system SHALL show a readable schema definition and the candidate's observed, guided, inferred, or existing origins
- **AND** SHALL show source, document, and chunk evidence references without making fingerprints and complete opaque identifiers the dominant content
- **AND** SHALL place the complete candidate payload, fingerprints, and other transport-oriented fields behind a technical-details disclosure
- **AND** SHALL label `recommendationState` separately from `effectiveReviewState`
- **AND** SHALL not expose source text that the backend did not return

#### Scenario: Candidate represents a rename or normalization
- **WHEN** a candidate's original label, property, or relationship type differs from its normalized value
- **THEN** the system SHALL present the original and proposed values as a change rather than requiring the user to infer it from technical fields

#### Scenario: Candidate has a persisted decision
- **WHEN** a candidate response includes an effective review state and latest decision ID
- **THEN** the system SHALL display the persistent state and provide navigation to the matching decision-history entry
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
The system SHALL present draft conflicts as a compact, guided review queue with type, coordinate, alternatives, evidence availability, and resolution state; SHALL require exactly one valid backend-provided alternative or one custom structured resolution; and SHALL keep resolution controls collapsed until the user chooses a conflict to review.

#### Scenario: Scan unresolved conflicts
- **WHEN** the Conflicts section contains unresolved conflicts
- **THEN** the system SHALL place unresolved conflicts before resolved conflicts
- **AND** SHALL show each conflict as a compact summary with readable coordinate, human-friendly type, unresolved status, and a concise description of the decision required
- **AND** SHALL not render a custom structured editor or complete evidence payload for every collapsed conflict

#### Scenario: Focus a conflict for resolution
- **WHEN** the user chooses to review an unresolved conflict
- **THEN** the system SHALL reveal its resolution workflow and keep other unresolved conflict workflows collapsed
- **AND** SHALL constrain the active content to a readable width without causing horizontal overflow at supported viewport sizes
- **AND** SHALL keep evidence and transport-oriented details behind separate disclosures

#### Scenario: Resolve with an existing alternative
- **WHEN** the user chooses the suggested-value mode, selects one backend-provided alternative, and confirms
- **THEN** the system SHALL present the alternatives as readable selectable choices
- **AND** SHALL submit that alternative with the current draft revision
- **AND** SHALL not submit a custom resolution
- **AND** SHALL refresh conflicts, projection, diff, readiness-related state, and draft revision

#### Scenario: Resolve with a custom value
- **WHEN** the user chooses the custom-value mode, supplies a valid structured resolution, and confirms
- **THEN** the system SHALL show the custom structured editor only for that active mode
- **AND** SHALL submit the structured custom value and optional rationale
- **AND** SHALL not submit a selected alternative

#### Scenario: Switch resolution modes
- **WHEN** the user switches between suggested-value and custom-value modes
- **THEN** the system SHALL hide the inactive mode's controls and clear its resolution value
- **AND** SHALL prevent confirmation until the active mode contains a valid resolution

#### Scenario: Inspect a resolved or published conflict
- **WHEN** a conflict is resolved or its draft is published
- **THEN** the system SHALL show a compact read-only summary of the resolution state and the selected or custom resolution returned by the backend
- **AND** SHALL not show mutation controls
- **AND** SHALL keep evidence and technical values available through progressive disclosure

#### Scenario: Render an unfamiliar conflict payload
- **WHEN** alternatives or evidence contain arrays, keyed objects, scalar values, null, or another backend-provided structured shape
- **THEN** the system SHALL render a safe readable summary without throwing
- **AND** SHALL preserve exact selectable alternative identifiers for submission
- **AND** SHALL make the complete payload available in technical details

### Requirement: Effective projection is inspectable but not directly replaceable
The system SHALL render the backend effective projection in a readable, expandable tree view and a separate structured JSON view with aggregate and draft revision context, and SHALL direct edits through decisions and conflict resolutions.

#### Scenario: View current projection
- **WHEN** a current aggregate exists
- **THEN** the system SHALL show the projected schema and whether draft-review preconditions are currently satisfied
- **AND** the default Readable view SHALL display nested projection keys and values through the same tree presentation used by schema JSON workflows
- **AND** the tree presentation SHALL be read-only

#### Scenario: Inspect exact structured projection JSON
- **WHEN** the user selects Structured JSON for a current projection
- **THEN** the system SHALL show the exact projection schema as formatted JSON
- **AND** switching between Structured JSON and Readable view SHALL NOT modify the projection content

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
The system SHALL paginate candidate data, render collapsed candidate rows at review-queue density, collapse detailed evidence and technical payloads by default, and avoid rendering all candidate evidence and diff payloads eagerly.

#### Scenario: Candidate result spans multiple pages
- **WHEN** the candidate count exceeds the requested page size
- **THEN** the system SHALL expose page navigation with stable query keys and retain prior page data during navigation

#### Scenario: Review a page of collapsed candidates
- **WHEN** a candidate page is first displayed
- **THEN** the system SHALL keep every candidate's detailed evidence and technical payload collapsed
- **AND** SHALL allow the user to scan substantially more candidates than the existing transport-oriented card layout without losing decision-relevant summary information

#### Scenario: Inspect decision history
- **WHEN** the Candidates section contains append-only decision history
- **THEN** the system SHALL present that history as secondary content collapsed by default
- **AND** SHALL reveal and focus the matching history entry when the user follows a candidate's latest-decision link

### Requirement: Candidate review order reflects schema hierarchy and analyzer strength
The system SHALL organize the complete candidate result into a deterministic logical sequence before applying Candidates UI pagination. The sequence SHALL contain every candidate exactly once, SHALL place all node groups before all relationship groups, and SHALL keep matching child candidates immediately after their parent within each group. Analyzer ordering SHALL NOT alter or imply a candidate's effective persistent review state.

#### Scenario: Order node groups and their children
- **WHEN** the candidate result contains node candidates and matching node-property or node-key candidates
- **THEN** the system SHALL order node candidates by analyzer confidence from highest to lowest, with missing confidence after provided confidence
- **AND** SHALL use independent-source support from greatest to least and stable candidate coordinates as subsequent tie-breakers
- **AND** SHALL place each node's property and key candidates immediately after that node
- **AND** SHALL order those children by confidence from highest to lowest, then independent-source support from greatest to least, followed by stable kind and coordinate tie-breakers

#### Scenario: Order relationships after nodes
- **WHEN** the candidate result contains relationship candidates
- **THEN** the system SHALL place every relationship group after every node group and unmatched node-owned candidate
- **AND** SHALL order relationships by recommendation state in the sequence `RECOMMENDED`, `REVIEW_REQUIRED`, `LOW_SUPPORT`, `SUPPRESSED`
- **AND** SHALL use confidence from highest to lowest, independent-source support from greatest to least, and stable relationship coordinates as subsequent tie-breakers
- **AND** SHALL place each matching relationship-property candidate immediately after its relationship, ordered by confidence, support, and stable property coordinates

#### Scenario: Keep ordering deterministic for missing or equal signals
- **WHEN** candidates have equal confidence and support or do not provide confidence
- **THEN** the system SHALL use normalized human-readable coordinates and candidate identity as deterministic tie-breakers
- **AND** SHALL place null confidence after any numeric confidence within the applicable comparison group
- **AND** SHALL produce the same sequence for equivalent candidate sets regardless of backend response order

#### Scenario: Preserve children without matching parents
- **WHEN** a node-owned or relationship-owned candidate has no matching parent candidate in the complete result
- **THEN** the system SHALL retain the unmatched candidate exactly once
- **AND** SHALL place unmatched node-owned candidates after complete node groups and before relationships
- **AND** SHALL place unmatched relationship-owned candidates after complete relationship groups
- **AND** SHALL NOT fabricate a reviewable parent candidate

#### Scenario: Organize across backend page boundaries
- **WHEN** matching parents and children or node and relationship candidates are returned on different backend pages
- **THEN** the system SHALL combine the complete candidate result before organizing it
- **AND** SHALL paginate the organized sequence into fixed-size candidate-item pages
- **AND** SHALL preserve global adjacency even when a parent is the last item of one UI page and its child is the first item of the next

#### Scenario: Describe review workbench totals explicitly
- **WHEN** an analysis outcome, analysis history, or Candidates pager is displayed for any page and total count
- **THEN** the system SHALL render `Page <current page> · <count> items total`
- **AND** SHALL use the complete item count for the corresponding paged result as `<count>`

#### Scenario: Candidate count shrinks after refresh
- **WHEN** refreshed candidate data leaves the selected UI page beyond the last available page
- **THEN** the system SHALL move to the last valid page of the organized sequence
- **AND** SHALL keep previous and next navigation boundaries consistent with the organized candidate count

### Requirement: Candidate review queue supports composable filtering
The system SHALL provide a filter toolbar above the Candidates review queue that filters the complete candidate result by text, candidate kind, analyzer recommendation state, effective persistent review state, and evidence origin without changing the backend candidate request contract.

#### Scenario: Open the unfiltered candidate queue
- **WHEN** the Candidates section is opened or remounted
- **THEN** every filter SHALL default to its unfiltered value
- **AND** the system SHALL show the existing complete organized candidate result
- **AND** the filter controls SHALL have explicit accessible labels

#### Scenario: Search candidate definitions and coordinates
- **WHEN** a user enters a non-blank text query
- **THEN** the system SHALL trim the query and match it case-insensitively against readable candidate definitions and candidate schema coordinates
- **AND** SHALL include canonical and original label, property, relationship type, endpoint, key, and identity values when present
- **AND** a blank or whitespace-only query SHALL match all candidates

#### Scenario: Filter by one categorical dimension
- **WHEN** a user selects a candidate kind, analyzer recommendation, persistent review state, or origin
- **THEN** the system SHALL retain only candidates with the selected exact kind, recommendation, normalized review state, or included origin
- **AND** SHALL treat a null or `PENDING` effective review state as `Unreviewed`
- **AND** each dimension SHALL provide an option that accepts all values

#### Scenario: Combine active filters
- **WHEN** more than one filter criterion is active
- **THEN** the system SHALL retain only candidates that satisfy every active criterion
- **AND** SHALL preserve their relative order from the complete organized candidate sequence
- **AND** SHALL NOT implicitly include a parent or child candidate that does not satisfy the criteria

#### Scenario: Clear active filters
- **WHEN** a user activates Clear filters
- **THEN** the system SHALL restore the blank text query and all categorical filters to their unfiltered values
- **AND** SHALL return the candidate queue to the complete organized result

### Requirement: Candidate filter results integrate with pagination and feedback
The system SHALL apply candidate filters before Candidates UI pagination, SHALL paginate only matching candidates, and SHALL clearly communicate the filtered result state.

#### Scenario: Filter criteria change
- **WHEN** a user changes or clears any candidate filter
- **THEN** the system SHALL move to the first UI page of the resulting candidate set
- **AND** SHALL apply the fixed candidate page size to the filtered sequence

#### Scenario: Display filtered totals
- **WHEN** filters are active and at least one candidate matches
- **THEN** the system SHALL show the number of matching candidates in the result summary
- **AND** SHALL retain the complete candidate count as context
- **AND** the Candidates pager total and navigation boundaries SHALL use the matching candidate count

#### Scenario: No candidates match active filters
- **WHEN** active filters produce zero matching candidates
- **THEN** the system SHALL render a `No matching candidates` empty state below the filter toolbar
- **AND** SHALL offer guidance to adjust or clear filters
- **AND** SHALL NOT render stale candidate rows from the prior result

#### Scenario: Candidate data changes while filters are active
- **WHEN** refreshed candidate data reduces the filtered result below the currently selected page
- **THEN** the system SHALL move to the last valid filtered page
- **AND** SHALL keep previous and next navigation boundaries consistent with the filtered candidate count
