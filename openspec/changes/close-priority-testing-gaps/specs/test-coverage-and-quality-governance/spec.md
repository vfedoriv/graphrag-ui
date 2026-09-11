## MODIFIED Requirements

### Requirement: High-risk test gaps MUST be tracked and prioritized
The system SHALL maintain a dated testing-gap report for untested or under-tested high-risk areas. The report SHALL identify the measured coverage baseline and configured thresholds, show remaining threshold headroom, and prioritize concrete gaps by affected workflow, risk rationale, intended validation, and closure criteria.

#### Scenario: Review testing gap plan
- **WHEN** maintainers inspect the testing-gap report
- **THEN** they SHALL see the measurement date and coverage baseline used for the assessment
- **AND** they SHALL see a prioritized list of concrete missing tests with affected workflows, rationale, intended validation, and closure criteria

#### Scenario: Refresh the testing gap plan
- **WHEN** targeted gap-closure work or material source changes make the recorded baseline or priorities stale
- **THEN** maintainers SHALL update the report from a successful current coverage run
- **AND** resolved items SHALL be removed or explicitly recorded as closed rather than remaining as indefinite maintenance advice

### Requirement: Critical coverage-gap closure is tracked by executable tests
The system SHALL close current high-risk testing gaps with executable regression tests covering document source and processing failure paths, Advanced Search run lifecycle edge cases, and selected interaction branches in schema building and schema-draft candidate decisions.

#### Scenario: Run focused gap-closure suite
- **WHEN** maintainers run the targeted gap-closure tests
- **THEN** the suite SHALL verify document opening and processing errors, confirmations, and fallback behavior
- **AND** it SHALL verify Advanced Search knowledge-base changes, stale or mismatched runs, validation failures, and mutation failures
- **AND** it SHALL verify the selected schema-builder and candidate-decision interactions identified by the gap report

### Requirement: Coverage gates track the current baseline
The system SHALL enforce coverage thresholds that are close enough to the current test baseline to prevent meaningful regression while retaining deliberate safety margin for behavior-preserving maintenance.

#### Scenario: Run coverage after threshold ratchet
- **WHEN** a developer runs `npm run coverage`
- **THEN** the coverage command SHALL enforce thresholds of at least 80 percent statements, 70 percent branches, 78 percent functions, and 82 percent lines

#### Scenario: Reassess thresholds after prioritized gap closure
- **WHEN** the prioritized gap-closure suite is green and a current coverage run establishes a higher stable baseline
- **THEN** maintainers SHALL record the new measurements and threshold headroom in the testing-gap report
- **AND** they SHALL raise thresholds only when the new values retain a documented safety margin

#### Scenario: Coverage threshold fails
- **WHEN** a change reduces coverage below the configured thresholds
- **THEN** maintainers SHALL add targeted tests or explicitly adjust the threshold with rationale in the same change
