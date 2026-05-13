## ADDED Requirements

### Requirement: Long-running backend activity is globally understandable
The system SHALL provide a consistent pending-state language across controller pages so users understand that backend work is active and the UI is awaiting results.

#### Scenario: User navigates while request is pending
- **WHEN** a request-triggering action is pending in the current controller view
- **THEN** visible pending feedback SHALL remain clear enough that users understand why final results are not yet available
