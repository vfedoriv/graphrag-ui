## MODIFIED Requirements

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
