## ADDED Requirements

### Requirement: Error-state regressions are covered by controller workflow tests
The system SHALL include regression tests for critical controller error states introduced by mutation/query error handling requirements.

#### Scenario: Validate error-state behavior in controller pages
- **WHEN** API requests fail in query, knowledge-base, document, or schema workflows
- **THEN** automated tests SHALL verify visible error alerts are rendered with expected failure messages
