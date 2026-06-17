## MODIFIED Requirements

### Requirement: Users can manage knowledge bases
The system SHALL provide knowledge base management from a single Knowledge Bases controller page with an inline create section and table-based actions for select, explicit rename, and delete.

#### Scenario: Create knowledge base from inline section
- **WHEN** a user opens the Knowledge Bases page
- **THEN** the system SHALL show the create form directly on the page without requiring a tab switch

#### Scenario: View knowledge base names as read-only table content
- **WHEN** a user views the knowledge bases table
- **THEN** the `Name` column SHALL render knowledge base names as read-only content by default
- **AND** the table SHALL NOT render editable name inputs in every row by default

#### Scenario: Start rename from dedicated row action
- **WHEN** a user chooses the dedicated edit action for a knowledge base row
- **THEN** the system SHALL show row-scoped rename controls for that knowledge base

### Requirement: Inline name edits only trigger meaningful updates
The system SHALL trigger knowledge base rename mutations only from explicit row-scoped rename controls when the submitted value differs from the current value, and failed updates SHALL keep the current displayed value aligned with known backend state.

#### Scenario: Cancel rename does not send update
- **WHEN** a user starts editing a knowledge base name and cancels without saving
- **THEN** the system SHALL NOT send an update request
- **AND** the row SHALL return to read-only name display

#### Scenario: Save without change does not send update
- **WHEN** a user starts editing a knowledge base name and saves the unchanged value
- **THEN** the system SHALL NOT send an update request
- **AND** the row SHALL return to read-only name display

#### Scenario: Failed rename does not silently overwrite row identity
- **WHEN** an explicit rename request fails
- **THEN** the row SHALL remain associated with its original knowledge base identity and visible error feedback SHALL remain scoped to that row/page context

## ADDED Requirements

### Requirement: Knowledge base row actions are visually consistent
The system SHALL render knowledge base table row actions with consistent button sizing, alignment, and spacing across select, edit/update, cancel, and delete actions.

#### Scenario: Render row action buttons
- **WHEN** a user views the knowledge bases table
- **THEN** row action buttons SHALL use consistent visual dimensions and alignment within the actions column

#### Scenario: Render selected row action state
- **WHEN** a knowledge base row is currently selected
- **THEN** its selected/current action state SHALL preserve the same row action sizing as other row actions

### Requirement: Knowledge base delete requires confirmation
The system SHALL require user confirmation before sending a knowledge base delete request and SHALL warn that all data related to the knowledge base will be deleted.

#### Scenario: Confirm knowledge base delete
- **WHEN** a user chooses Delete for a knowledge base row and confirms the warning
- **THEN** the system SHALL send the delete request for that knowledge base
- **AND** successful selected-row deletion SHALL clear selected knowledge base state

#### Scenario: Cancel knowledge base delete
- **WHEN** a user chooses Delete for a knowledge base row and declines the warning
- **THEN** the system SHALL NOT send a delete request
- **AND** selected knowledge base state SHALL remain unchanged

#### Scenario: Delete request fails after confirmation
- **WHEN** a user confirms deletion and the delete request fails
- **THEN** the system SHALL render a visible delete failure alert and SHALL NOT clear selected knowledge base state

### Requirement: Knowledge Bases page copy is user-facing and clear
The system SHALL describe Knowledge Bases page behavior using user-facing language and SHALL NOT expose unclear internal implementation phrasing.

#### Scenario: Render Knowledge Bases page description
- **WHEN** a user opens the Knowledge Bases page
- **THEN** the page description SHALL NOT include the sentence "Mutations update the visible list and keep selection state honest."
