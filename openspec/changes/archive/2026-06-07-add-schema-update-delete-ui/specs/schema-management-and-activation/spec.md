## ADDED Requirements

### Requirement: Schema list supports mutation actions
The system SHALL expose update and delete actions for schemas in the Schemas page list while preserving existing list, activation, create, get-by-id, and validation workflows.

#### Scenario: Schema list renders update and delete actions
- **WHEN** a user opens the Schemas page with schemas for the selected knowledge base
- **THEN** each schema row SHALL expose controls for update and delete in addition to the existing activation state/action

#### Scenario: Active schema mutation is guarded by backend response
- **WHEN** a schema update or delete request is rejected because the schema is active or otherwise conflicts with backend mutation rules
- **THEN** the system SHALL render the backend conflict as visible error feedback in the Schemas page context
- **AND** the system SHALL NOT remove the schema row or report a successful update

#### Scenario: Existing schema workflows remain available
- **WHEN** update and delete actions are added to the Schemas page
- **THEN** the existing generate, validate, create, get-by-id, and activate workflows SHALL remain available from the same controller page
