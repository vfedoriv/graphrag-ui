## MODIFIED Requirements

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
