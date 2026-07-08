## ADDED Requirements

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
