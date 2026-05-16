## Purpose

This specification defines the required behavior for query authoring and execution in the GraphRAG admin UI.
## Requirements
### Requirement: Users can generate, validate, and execute Cypher
The system SHALL expose Cypher-related endpoint operations as tabs inside a single Queries controller page.

#### Scenario: Cypher workflows are tab-grouped
- **WHEN** a user opens the Queries page
- **THEN** the system SHALL display query context first and provide generate/validate/execute-related operations as tabs

### Requirement: Users can run one-shot ask workflow
The system SHALL keep one-shot ask as a dedicated tabbed workflow on the Queries page and return results in the same page context.

#### Scenario: Execute ask from tab
- **WHEN** a user submits an ask request from the Ask tab
- **THEN** the system SHALL execute the ask endpoint and display results without leaving the Queries page

### Requirement: Query workflow failures are visible to users
The system SHALL show explicit error feedback in the Queries controller for ask, generate, validate, and execute failures, and SHALL not rely on silent mutation failure behavior.

#### Scenario: Ask mutation fails
- **WHEN** ask endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Ask tab with actionable failure message

#### Scenario: Generate mutation fails
- **WHEN** generate endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Generate tab and keep existing inputs/results stable

### Requirement: Query parameter JSON areas are format-aware
The system SHALL treat query parameter fields as JSON-aware editors/previews with explicit JSON format indication and formatting support.

#### Scenario: Edit query parameter JSON
- **WHEN** a user edits JSON parameters for generate/validate/execute workflows
- **THEN** the UI SHALL provide JSON-aware presentation and allow formatting action for valid JSON input

### Requirement: Query parameter JSON must be valid before endpoint submission
The system SHALL prevent validate and execute query submissions when the query parameter JSON draft is invalid, instead of silently replacing invalid parameters with an empty object.

#### Scenario: Validate with invalid parameters JSON
- **WHEN** a user attempts to validate a Cypher query while the parameters JSON field contains invalid JSON
- **THEN** the system SHALL block the validation request and render the parameter format error

#### Scenario: Execute with invalid parameters JSON
- **WHEN** a user attempts to execute a Cypher query while the parameters JSON field contains invalid JSON
- **THEN** the system SHALL block the execution request and render the parameter format error

### Requirement: Query authoring draft state remains user-editable
The system SHALL keep prompt, Cypher, and parameter JSON values as client-owned drafts while using mutation hooks for backend generate, validate, execute, and ask request state.

#### Scenario: Generated query seeds editable draft
- **WHEN** query generation succeeds
- **THEN** the system SHALL populate editable Cypher and parameter draft fields from the response while allowing the user to modify them before validation or execution

