## ADDED Requirements

### Requirement: Persisted knowledge base selection is reconciled with server data
The system SHALL reconcile the persisted selected knowledge-base id against the server-backed knowledge-base list after the list has loaded successfully.

#### Scenario: Persisted selected knowledge base no longer exists
- **WHEN** the knowledge-base list loads successfully and does not contain the persisted selected knowledge-base id
- **THEN** the system SHALL clear the selected knowledge-base id and update persisted selection storage accordingly

#### Scenario: Persisted selected knowledge base still exists
- **WHEN** the knowledge-base list loads successfully and contains the persisted selected knowledge-base id
- **THEN** the system SHALL keep that knowledge base selected

#### Scenario: Knowledge-base list has not loaded
- **WHEN** the knowledge-base list is still loading or failed to load
- **THEN** the system SHALL NOT clear the persisted selected knowledge-base id based only on missing query data
