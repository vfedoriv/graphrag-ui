# browser-e2e-test-coverage Specification

## Purpose

This specification defines browser-level end-to-end coverage expectations for critical GraphRAG UI workflows executed with Playwright.
## Requirements
### Requirement: Playwright suite runs against the local GraphRAG UI
The system SHALL provide Playwright browser tests that run against the local Vite-served GraphRAG UI rather than external sample sites.

#### Scenario: Execute browser suite locally
- **WHEN** a developer runs the project Playwright test command
- **THEN** Playwright SHALL start or reuse the local Vite app and execute tests against same-origin application routes

#### Scenario: Avoid external sample tests
- **WHEN** the Playwright suite is inspected or executed
- **THEN** it SHALL NOT require navigation to third-party sample sites for its normal pass path

### Requirement: Browser tests use deterministic API mocks
The system SHALL mock GraphRAG API requests made by browser tests so the suite does not require a live backend service.

#### Scenario: Exercise API-backed UI without backend
- **WHEN** a browser test visits a controller page that requests `/api/v1` data
- **THEN** the test SHALL provide deterministic mocked responses for the relevant API calls

#### Scenario: Surface unexpected API calls
- **WHEN** the UI sends an unhandled `/api/v1` request during a browser test
- **THEN** the test SHALL fail or explicitly report the missing mock instead of silently depending on a real backend

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

### Requirement: Browser mocks cover current route-level API calls
The system SHALL keep Playwright API mocks aligned with all `/api/v1` requests made by covered app-shell and controller routes.

#### Scenario: Visit covered routes with deterministic mocks
- **WHEN** a browser test visits dashboard, knowledge-base, schema, document, query, or settings routes
- **THEN** the Playwright mock SHALL handle each expected `/api/v1` request for that route
- **AND** unexpected API calls SHALL remain visible as test failures

#### Scenario: Settings route requests backend configuration
- **WHEN** a browser test navigates to Settings
- **THEN** the mock SHALL provide deterministic responses for runtime settings and AI profile requests

### Requirement: Browser selectors track user-visible current UI
The system SHALL assert browser workflows through stable user-facing roles, labels, test ids, and current accessible text instead of obsolete implementation-specific selectors.

#### Scenario: App shell markup changes without behavior changing
- **WHEN** the app shell renders the same navigation and workspace selection behavior with updated markup
- **THEN** browser tests SHALL continue to assert the behavior through stable accessible selectors
