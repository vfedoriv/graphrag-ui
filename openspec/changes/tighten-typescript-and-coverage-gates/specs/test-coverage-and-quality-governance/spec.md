## ADDED Requirements

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
