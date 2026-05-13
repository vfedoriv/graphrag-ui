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

