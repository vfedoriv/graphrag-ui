## Purpose

This specification defines the required behavior for knowledge base management in the GraphRAG admin UI.

## Requirements

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

### Requirement: Mutations update visible state consistently
The system SHALL refresh list and detail views in-place after knowledge base mutations performed from page actions.

#### Scenario: Mutation updates top list section
- **WHEN** a user completes a knowledge base mutation from inline form or row actions
- **THEN** the system SHALL update the visible knowledge base list/context to reflect backend state changes

### Requirement: Knowledge base mutation failures are surfaced inline
The system SHALL render explicit error feedback for create, update, and delete knowledge base failures in the Knowledge Bases controller page.

#### Scenario: Update fails
- **WHEN** a knowledge base name update request fails
- **THEN** the system SHALL render a visible update failure alert in the page context

#### Scenario: Delete fails
- **WHEN** delete request fails
- **THEN** the system SHALL render a visible delete failure alert and SHALL NOT clear selected knowledge base state

### Requirement: Knowledge base table rows maintain stable identity
The system SHALL render knowledge base rows with stable row keys derived from persistent knowledge base identifiers so row-local UI state does not migrate between rows after delete/reorder updates.

#### Scenario: Delete row preserves neighboring row identity
- **WHEN** a knowledge base row is removed from the list
- **THEN** remaining rows SHALL preserve their own row state instead of reusing deleted row state

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

### Requirement: Knowledge base delete workflow state reconciliation is tested
The system SHALL include workflow tests for delete behavior that verify selected knowledge base state is reconciled when the selected row is removed.

#### Scenario: Delete selected knowledge base
- **WHEN** a user deletes the currently selected knowledge base
- **THEN** tests SHALL verify selected knowledge base state is cleared and list state updates accordingly

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

### Requirement: Knowledge bases display active AI profile context
The system SHALL display each knowledge base's active AI profile assignment alongside existing knowledge base and active schema context.

#### Scenario: User views knowledge base table
- **WHEN** a user views the Knowledge Bases page
- **THEN** the system SHALL render the `activeAiProfileId` for each knowledge base when present
- **AND** the system SHALL render an explicit empty state when no active AI profile is assigned or available

#### Scenario: User views selected workspace context
- **WHEN** a knowledge base is selected in the app shell or controller page workspace context
- **THEN** the system SHALL include active AI profile context when it is available from backend data

### Requirement: Knowledge base active AI profile can be assigned
The system SHALL let users assign an existing AI profile to a knowledge base through `/api/v1/knowledge-bases/{knowledgeBaseId}/ai-profile`.

#### Scenario: User assigns profile to knowledge base
- **WHEN** a user selects an existing AI profile for a knowledge base and confirms the assignment
- **THEN** the system SHALL submit `{ profileId }` to the knowledge base active AI profile endpoint
- **AND** the system SHALL refresh knowledge base and active profile context after success

#### Scenario: Profile assignment fails
- **WHEN** the backend rejects a profile assignment because the profile is missing, incompatible, or invalid for the knowledge base
- **THEN** the system SHALL show visible error feedback in the Knowledge Bases page context
- **AND** the system SHALL keep the previous active AI profile visible

### Requirement: Active AI profile is surfaced for AI-backed workflows
The system SHALL show the selected knowledge base's active AI profile on pages that run AI-backed workflows.

#### Scenario: User opens schema generation workflow
- **WHEN** a user opens schema example or schema JSON generation for a selected knowledge base
- **THEN** the system SHALL show the active AI profile context used by generation requests

#### Scenario: User opens document processing workflow
- **WHEN** a user opens document processing for a selected knowledge base
- **THEN** the system SHALL show the active AI profile context used for embedding and graph extraction

#### Scenario: User opens query workflow
- **WHEN** a user opens query ask, Cypher generation, or hybrid search for a selected knowledge base
- **THEN** the system SHALL show the active AI profile context used by query-related AI calls
