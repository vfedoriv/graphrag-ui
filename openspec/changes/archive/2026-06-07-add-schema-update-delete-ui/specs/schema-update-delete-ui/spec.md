## ADDED Requirements

### Requirement: Users can edit persisted schema content
The system SHALL allow users to load an existing schema into an editable JSON workflow and save replacement schema content through the backend schema update endpoint.

#### Scenario: Start schema update from list row
- **WHEN** a user selects Update for a schema row
- **THEN** the system SHALL fetch schema details for that schema id
- **AND** the system SHALL display the schema content in an editable schema JSON editor

#### Scenario: Save schema update
- **WHEN** a user edits loaded schema content and selects Save
- **THEN** the system SHALL call `PUT /api/v1/schemas/{schemaId}` with the replacement `content`
- **AND** the system SHALL render the updated schema details or success state without leaving the Schemas page
- **AND** the system SHALL refresh schema list and schema detail cache state affected by the update

#### Scenario: Cancel schema update
- **WHEN** a user has an update draft open and selects Cancel
- **THEN** the system SHALL discard the local update draft
- **AND** the system SHALL NOT call the schema update endpoint

#### Scenario: Schema update fails
- **WHEN** the backend rejects a schema update request with a `ProblemDetail` response
- **THEN** the system SHALL keep the attempted update draft visible
- **AND** the system SHALL render a visible update failure alert containing the normalized backend error message

### Requirement: Users can delete schemas with confirmation
The system SHALL allow users to delete an existing schema only after explicit confirmation.

#### Scenario: Request schema deletion
- **WHEN** a user selects Delete for a schema row
- **THEN** the system SHALL display a confirmation dialog that identifies the schema
- **AND** the system SHALL NOT call the delete endpoint until the user confirms

#### Scenario: Confirm schema deletion
- **WHEN** a user confirms deletion for a schema
- **THEN** the system SHALL call `DELETE /api/v1/schemas/{schemaId}`
- **AND** the system SHALL close the confirmation dialog after success
- **AND** the system SHALL refresh schema list and schema detail cache state affected by the deletion

#### Scenario: Cancel schema deletion
- **WHEN** a user cancels a pending delete confirmation
- **THEN** the system SHALL close the confirmation dialog
- **AND** the system SHALL NOT call the schema delete endpoint

#### Scenario: Schema delete fails
- **WHEN** the backend rejects a schema delete request with a `ProblemDetail` response
- **THEN** the system SHALL keep or restore enough schema context for the user to understand which delete failed
- **AND** the system SHALL render a visible delete failure alert containing the normalized backend error message

### Requirement: Schema mutation controls expose pending state
The system SHALL prevent duplicate schema update and delete requests while the corresponding mutation is pending.

#### Scenario: Update request is pending
- **WHEN** a schema update request is in flight
- **THEN** the Save control SHALL show pending feedback and SHALL be disabled against duplicate submission

#### Scenario: Delete request is pending
- **WHEN** a schema delete request is in flight
- **THEN** the confirming delete control SHALL show pending feedback and SHALL be disabled against duplicate submission
