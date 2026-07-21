## ADDED Requirements

### Requirement: Conflict responses preserve aggregate lineage compatibility
The system SHALL validate schema-draft conflict list items and conflict-resolution success responses against the backend contract, including the required `aggregateRevisionId` string and `current` boolean, while retaining strict rejection of undeclared response fields.

#### Scenario: Load current conflict review items
- **WHEN** the backend returns the default conflict list with `aggregateRevisionId` and `current` on every item
- **THEN** the system SHALL accept the response and make the conflicts available to the existing review queue

#### Scenario: Accept a successful conflict resolution
- **WHEN** the backend returns the resolved conflict with `aggregateRevisionId` and `current`
- **THEN** the system SHALL accept the mutation response and perform the existing conflict-related refresh behavior

#### Scenario: Request the active review scope
- **WHEN** the existing conflict review surface loads conflicts
- **THEN** the system SHALL use the endpoint's default `CURRENT` scope without requesting historical conflicts
