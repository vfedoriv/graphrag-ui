## MODIFIED Requirements

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
