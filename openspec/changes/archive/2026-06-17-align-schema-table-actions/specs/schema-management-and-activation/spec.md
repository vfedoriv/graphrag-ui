## MODIFIED Requirements

### Requirement: Schema list supports mutation actions
The system SHALL expose details, update, and delete actions for schemas in the Schemas page list while preserving existing list, activation, create, validation, and generation workflows. Row action controls SHALL be visually aligned in stable action slots independent of variable schema metadata in earlier columns, variable action label lengths, and action button variants.

#### Scenario: Schema list renders details, update, and delete actions
- **WHEN** a user opens the Schemas page with schemas for the selected knowledge base
- **THEN** each schema row SHALL expose controls for details, update, and delete in addition to the existing activation state/action

#### Scenario: Schema row actions stay aligned
- **WHEN** schema rows contain different schema names, versions, source types, statuses, or activation labels such as `Active` and `Activate`
- **THEN** row action controls SHALL remain aligned in a consistent actions column
- **AND** action controls SHALL NOT shift horizontally based on the width of earlier row values
- **AND** action controls SHALL NOT shift horizontally based on button text length within the action group
- **AND** action controls SHALL preserve consistent button height across standard, active-state, and danger actions such as `Delete`

#### Scenario: Active schema mutation is guarded by backend response
- **WHEN** a schema update or delete request is rejected because the schema is active or otherwise conflicts with backend mutation rules
- **THEN** the system SHALL render the backend conflict as visible error feedback in the Schemas page context
- **AND** the system SHALL NOT remove the schema row or report a successful update

#### Scenario: Existing schema workflows remain available
- **WHEN** schema list layout and row actions are updated
- **THEN** the existing generate, validate, create, and activate workflows SHALL remain available from the same controller page
