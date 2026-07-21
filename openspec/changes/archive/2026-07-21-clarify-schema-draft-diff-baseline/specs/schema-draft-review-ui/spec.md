## MODIFIED Requirements

### Requirement: Compatibility diffs explain schema evolution
The system SHALL render stable compatibility diff items with coordinate, human-readable operation, before and after values, and an explicitly labeled `ADDITIVE`, `REVIEW_REQUIRED`, or `BREAKING` compatibility status. The Diff section SHALL identify the current aggregate, draft revision, and backend-selected comparison baseline including its exact content hash, SHALL distinguish compatibility impact from exact decision provenance, SHALL summarize total and per-compatibility change counts, support filtering by compatibility and operation, report the number of visible results, and provide a clear action whenever filters are active. Diff items SHALL use accessible progressive disclosure, preserve backend order after filtering, and present expanded before and after states in responsive comparison panels without changing their exact values.

#### Scenario: Identify a base-schema comparison
- **WHEN** the diff response contains a baseline descriptor identifying `BASE_SCHEMA` with an ID and content hash
- **THEN** the system SHALL state that the current aggregate is compared with that base schema
- **AND** SHALL retain both exact identifiers and the content hash as secondary audit information

#### Scenario: Identify a previous-aggregate comparison
- **WHEN** the diff response contains a baseline descriptor identifying `PREVIOUS_AGGREGATE` with an ID and content hash
- **THEN** the system SHALL state that the current aggregate is compared with that previous aggregate
- **AND** SHALL not imply that the active registered schema is the baseline

#### Scenario: Identify an empty comparison baseline
- **WHEN** the diff response contains a baseline descriptor identifying `EMPTY` with a null ID and content hash
- **THEN** the system SHALL explain that the current projection is compared with an empty starting point
- **AND** SHALL not display a missing baseline ID as an error

#### Scenario: Baseline metadata is temporarily unavailable
- **WHEN** the diff response comes from a compatible backend version that does not yet provide baseline metadata
- **THEN** the system SHALL state that the comparison baseline is unavailable
- **AND** SHALL continue to render the backend-provided diff without guessing the baseline

#### Scenario: Diff response identifies its review revision
- **WHEN** the diff response includes a draft revision
- **THEN** the comparison summary SHALL identify that revision with the current aggregate
- **AND** SHALL keep revision and hash metadata secondary to the readable baseline explanation

#### Scenario: Scan the overall compatibility diff
- **WHEN** a compatibility diff contains one or more changes
- **THEN** the system SHALL show the total number of changes and the count in each compatibility class
- **AND** each collapsed item SHALL separately identify its coordinate, readable operation, and labeled compatibility status
- **AND** before and after payloads SHALL remain unrendered until their item is expanded

#### Scenario: Inspect an explicitly rejected breaking change
- **WHEN** a diff coordinate exactly matches the latest candidate decision and that decision is `REJECT`
- **THEN** the system SHALL label the change as originating from an explicit reject decision
- **AND** SHALL retain the separate `BREAKING` status as the compatibility impact
- **AND** SHALL not attribute rejection provenance to related coordinates without an exact decision match

#### Scenario: Inspect a breaking change
- **WHEN** a diff item is classified as `BREAKING`
- **THEN** the system SHALL visually distinguish it with a labeled status that does not depend on color alone
- **AND** expanding the item SHALL show both exact before and after values in labeled comparison panels
- **AND** keyboard users SHALL be able to focus and toggle the disclosure control with a visible focus indicator

#### Scenario: Inspect an added or removed value
- **WHEN** an expanded diff item has a null or absent before or after state
- **THEN** the corresponding comparison panel SHALL communicate that no value exists
- **AND** the system SHALL retain access to the exact serialized diff value

#### Scenario: Filter compatibility changes
- **WHEN** the user selects compatibility or operation filters
- **THEN** the system SHALL retain response order while showing only changes that satisfy all active filters
- **AND** SHALL report the visible result count relative to the total count
- **AND** SHALL expose an action that clears all active filters

#### Scenario: Filters have no matching changes
- **WHEN** active filters match no diff items
- **THEN** the system SHALL show a filter-specific empty state
- **AND** SHALL allow the user to clear the filters without reloading the diff

#### Scenario: View a diff on a narrow screen
- **WHEN** the available width cannot legibly contain side-by-side comparison panels or toolbar controls
- **THEN** the system SHALL stack the controls and before/after panels without clipping the coordinate, status, provenance, or exact values

#### Scenario: Reanalysis changes the aggregate
- **WHEN** a new current aggregate replaces the prior aggregate
- **THEN** the system SHALL invalidate and reload candidate, conflict, projection, and diff views while retaining backend decision history
