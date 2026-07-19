## ADDED Requirements

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
