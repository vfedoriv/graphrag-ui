## ADDED Requirements

### Requirement: Knowledge base table rows maintain stable identity
The system SHALL render knowledge base rows with stable row keys derived from persistent knowledge base identifiers so row-local UI state does not migrate between rows after delete/reorder updates.

#### Scenario: Delete row preserves neighboring row identity
- **WHEN** a knowledge base row is removed from the list
- **THEN** remaining rows SHALL preserve their own inline field state instead of reusing deleted row field state

### Requirement: Inline name edits only trigger meaningful updates
The system SHALL trigger knowledge base rename mutations only when the edited value differs from the current value, and failed updates SHALL keep the current displayed value aligned with known backend state.

#### Scenario: Blur without change does not send update
- **WHEN** a user focuses and blurs the inline name field without changing value
- **THEN** the system SHALL NOT send an update request

#### Scenario: Failed rename does not silently overwrite row identity
- **WHEN** an inline rename request fails
- **THEN** the row SHALL remain associated with its original knowledge base identity and visible error feedback SHALL remain scoped to that row/page context
