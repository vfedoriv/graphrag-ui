# test-coverage-and-quality-governance Specification

## Purpose
This specification defines coverage reporting, browser regression testing, and quality guardrails for the GraphRAG UI test suite.
## Requirements
### Requirement: Coverage reporting MUST be operational
The system SHALL provide a working coverage command that produces machine-readable and human-readable coverage output for the current Vitest suite.

#### Scenario: Run coverage command
- **WHEN** a developer runs the coverage script
- **THEN** the test run SHALL complete with coverage summary output and generated coverage artifacts

### Requirement: High-risk test gaps MUST be tracked and prioritized
The system SHALL maintain a documented, prioritized gap list for untested or under-tested high-risk areas, including API modules and critical feature workflows.

#### Scenario: Review testing gap plan
- **WHEN** maintainers inspect the testing improvement artifacts
- **THEN** they SHALL see a prioritized list of missing tests with implementation order and rationale

### Requirement: Test quality guardrails MUST be defined
The system SHALL define project test-quality guardrails including deterministic mocking patterns and initial coverage quality expectations.

#### Scenario: Add new tests under guardrails
- **WHEN** contributors add tests for new/changed behavior
- **THEN** the tests SHALL follow documented mock/setup patterns and align with established quality expectations

### Requirement: Error-state regressions are covered by controller workflow tests
The system SHALL include regression tests for critical controller error states introduced by mutation/query error handling requirements.

#### Scenario: Validate error-state behavior in controller pages
- **WHEN** API requests fail in query, knowledge-base, document, or schema workflows
- **THEN** automated tests SHALL verify visible error alerts are rendered with expected failure messages

### Requirement: Critical coverage-gap closure is tracked by executable tests
The system SHALL close critical testing gaps with executable tests covering file selection behavior, API client edge branches, and high-impact knowledge base/schema workflows.

#### Scenario: Run focused gap-closure suite
- **WHEN** maintainers run targeted tests for these critical areas
- **THEN** the suite SHALL pass and demonstrate coverage of the previously untested critical branches

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

### Requirement: Project quality guardrails validate the current source of truth
The system SHALL keep the documented project validation surface executable against the current codebase, current OpenSpec specs, and current project documentation.

#### Scenario: Validate all OpenSpec artifacts
- **WHEN** a developer runs `openspec validate --all`
- **THEN** all current specs and active changes SHALL validate without structural errors

#### Scenario: Follow documented validation references
- **WHEN** a developer follows project documentation for validation and quality gaps
- **THEN** referenced commands and documents SHALL exist or the documentation SHALL be updated to remove stale references

#### Scenario: Inspect generated output guidance
- **WHEN** a developer reads project source guidance
- **THEN** generated outputs such as `dist/` and `coverage/` SHALL be described as generated artifacts rather than source inputs

### Requirement: TypeScript strict mode is part of validation
The system SHALL run project TypeScript builds with `strict` compiler checking enabled for frontend source and local Node configuration code.

#### Scenario: Build with strict type checking
- **WHEN** a developer runs `npm run build`
- **THEN** TypeScript SHALL check the app and Vite configuration with strict compiler options enabled
- **AND** the build SHALL fail on strict-mode type errors

#### Scenario: Add type suppressions
- **WHEN** a strict-mode issue cannot be resolved directly
- **THEN** any suppression SHALL be local, intentional, and justified by nearby code or tests

### Requirement: Coverage gates track the current baseline
The system SHALL enforce coverage thresholds that are close enough to the current test baseline to prevent meaningful regression.

#### Scenario: Run coverage after threshold ratchet
- **WHEN** a developer runs `npm run coverage`
- **THEN** the coverage command SHALL enforce thresholds of at least 80 percent statements, 70 percent branches, 78 percent functions, and 82 percent lines

#### Scenario: Coverage threshold fails
- **WHEN** a change reduces coverage below the configured thresholds
- **THEN** maintainers SHALL add targeted tests or explicitly adjust the threshold with rationale in the same change

