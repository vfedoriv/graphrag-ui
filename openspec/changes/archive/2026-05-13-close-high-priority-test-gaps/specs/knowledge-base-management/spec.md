## ADDED Requirements

### Requirement: Knowledge base delete workflow state reconciliation is tested
The system SHALL include workflow tests for delete behavior that verify selected knowledge base state is reconciled when the selected row is removed.

#### Scenario: Delete selected knowledge base
- **WHEN** a user deletes the currently selected knowledge base
- **THEN** tests SHALL verify selected knowledge base state is cleared and list state updates accordingly
