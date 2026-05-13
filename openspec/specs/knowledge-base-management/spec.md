## Purpose

This specification defines the required behavior for knowledge base management in the GraphRAG admin UI.
## Requirements
### Requirement: Users can manage knowledge bases
The system SHALL provide knowledge base management from a single Knowledge Bases controller page with an inline create section and table-based actions for update/delete/select.

#### Scenario: Create knowledge base from inline section
- **WHEN** a user opens the Knowledge Bases page
- **THEN** the system SHALL show the create form directly on the page without requiring a tab switch

### Requirement: Mutations update visible state consistently
The system SHALL refresh list and detail views in-place after knowledge base mutations performed from page actions.

#### Scenario: Mutation updates top list section
- **WHEN** a user completes a knowledge base mutation from inline form or row actions
- **THEN** the system SHALL update the visible knowledge base list/context to reflect backend state changes

### Requirement: Knowledge base mutation failures are surfaced inline
The system SHALL render explicit error feedback for create, update, and delete knowledge base failures in the Knowledge Bases controller page.

#### Scenario: Inline update fails
- **WHEN** inline name update request fails
- **THEN** the system SHALL render a visible update failure alert in the page context

#### Scenario: Delete fails
- **WHEN** delete request fails
- **THEN** the system SHALL render a visible delete failure alert and SHALL NOT clear selected knowledge base state

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

### Requirement: Knowledge base delete workflow state reconciliation is tested
The system SHALL include workflow tests for delete behavior that verify selected knowledge base state is reconciled when the selected row is removed.

#### Scenario: Delete selected knowledge base
- **WHEN** a user deletes the currently selected knowledge base
- **THEN** tests SHALL verify selected knowledge base state is cleared and list state updates accordingly

