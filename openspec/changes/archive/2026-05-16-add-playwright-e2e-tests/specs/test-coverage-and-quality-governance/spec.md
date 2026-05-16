## ADDED Requirements

### Requirement: Browser-level regression tests are part of validation
The system SHALL include Playwright browser tests in the project validation surface for cross-page and controller workflow regressions.

#### Scenario: Run browser validation command
- **WHEN** maintainers run the documented Playwright test command
- **THEN** the command SHALL complete headlessly and report pass or actionable failure output

#### Scenario: Validate substantial UI changes
- **WHEN** a substantial UI change affects navigation, controller workflows, or global knowledge-base state
- **THEN** maintainers SHALL run the Playwright suite or document why it was not applicable

### Requirement: Playwright tests follow deterministic quality guardrails
The system SHALL define browser-test implementation patterns that keep Playwright tests deterministic, maintainable, and independent from external services.

#### Scenario: Add browser workflow tests
- **WHEN** contributors add Playwright tests for GraphRAG UI workflows
- **THEN** tests SHALL use stable selectors, same-origin app routes, deterministic `/api/v1` mocks, and no third-party sample-site dependencies
