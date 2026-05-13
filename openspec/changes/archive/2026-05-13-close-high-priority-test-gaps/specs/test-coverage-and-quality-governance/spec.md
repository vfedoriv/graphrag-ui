## ADDED Requirements

### Requirement: Critical coverage-gap closure is tracked by executable tests
The system SHALL close critical testing gaps with executable tests covering file selection behavior, API client edge branches, and high-impact knowledge base/schema workflows.

#### Scenario: Run focused gap-closure suite
- **WHEN** maintainers run targeted tests for these critical areas
- **THEN** the suite SHALL pass and demonstrate coverage of the previously untested critical branches
