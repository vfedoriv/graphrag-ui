## MODIFIED Requirements

### Requirement: Critical controller workflows have browser coverage
The system SHALL include Playwright coverage for navigation, global knowledge-base context, representative controller workflows, selected-context edge cases, disabled actions, empty states, and API failure states.

#### Scenario: Navigate across controller pages
- **WHEN** a browser test uses the app shell navigation
- **THEN** the dashboard, knowledge bases, schemas, documents, queries, and settings pages SHALL render their expected controller content

#### Scenario: Use global knowledge base context
- **WHEN** a browser test selects a knowledge base from the global selector
- **THEN** API-backed controller workflows SHALL consume and display behavior consistent with that selected knowledge base

#### Scenario: Validate representative controller workflows
- **WHEN** browser tests run critical knowledge-base, schema, document, and query workflows with mocked API responses
- **THEN** visible results, pending states, and error states SHALL match the expected user-facing behavior

#### Scenario: Verify selected-context edge states
- **WHEN** browser tests switch between knowledge bases with different mocked schemas or documents
- **THEN** controller pages SHALL display data, empty states, and available actions for the selected knowledge base only

#### Scenario: Verify disabled actions without selected knowledge base
- **WHEN** browser tests visit API-backed controller pages without an active knowledge base selected
- **THEN** actions that require a selected knowledge base SHALL be disabled or paired with visible contextual feedback

#### Scenario: Verify API failure feedback
- **WHEN** mocked API responses fail during schema, document, or query workflows
- **THEN** browser tests SHALL verify visible user-facing error feedback for the failed workflow
