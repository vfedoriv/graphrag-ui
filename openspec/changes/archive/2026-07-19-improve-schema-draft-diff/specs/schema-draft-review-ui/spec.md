## MODIFIED Requirements

### Requirement: Compatibility diffs explain schema evolution
The system SHALL render stable compatibility diff items with coordinate, human-readable operation, before and after values, and an explicitly labeled `ADDITIVE`, `REVIEW_REQUIRED`, or `BREAKING` compatibility status. The Diff section SHALL summarize total and per-compatibility change counts, support filtering by compatibility and operation, report the number of visible results, and provide a clear action whenever filters are active. Diff items SHALL use accessible progressive disclosure, preserve backend order after filtering, and present expanded before and after states in responsive comparison panels without changing their exact values.

#### Scenario: Scan the overall compatibility diff
- **WHEN** a compatibility diff contains one or more changes
- **THEN** the system SHALL show the total number of changes and the count in each compatibility class
- **AND** each collapsed item SHALL separately identify its coordinate, readable operation, and labeled compatibility status
- **AND** before and after payloads SHALL remain unrendered until their item is expanded

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
- **THEN** the system SHALL stack the controls and before/after panels without clipping the coordinate, status, or exact values

#### Scenario: Reanalysis changes the aggregate
- **WHEN** a new current aggregate replaces the prior aggregate
- **THEN** the system SHALL invalidate and reload candidate, conflict, projection, and diff views while retaining backend decision history
