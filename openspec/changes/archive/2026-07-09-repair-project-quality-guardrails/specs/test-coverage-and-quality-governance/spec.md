## ADDED Requirements

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
