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
The system SHALL include Playwright coverage for navigation, global knowledge-base context, and representative controller workflows.

#### Scenario: Navigate across controller pages
- **WHEN** a browser test uses the app shell navigation
- **THEN** the dashboard, knowledge bases, schemas, documents, queries, and settings pages SHALL render their expected controller content

#### Scenario: Use global knowledge base context
- **WHEN** a browser test selects a knowledge base from the global selector
- **THEN** API-backed controller workflows SHALL consume and display behavior consistent with that selected knowledge base

#### Scenario: Validate representative controller workflows
- **WHEN** browser tests run critical knowledge-base, schema, document, and query workflows with mocked API responses
- **THEN** visible results, pending states, and error states SHALL match the expected user-facing behavior
