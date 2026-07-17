## MODIFIED Requirements

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
