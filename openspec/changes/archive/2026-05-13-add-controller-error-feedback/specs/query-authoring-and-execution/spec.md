## ADDED Requirements

### Requirement: Query workflow failures are visible to users
The system SHALL show explicit error feedback in the Queries controller for ask, generate, validate, and execute failures, and SHALL not rely on silent mutation failure behavior.

#### Scenario: Ask mutation fails
- **WHEN** ask endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Ask tab with actionable failure message

#### Scenario: Generate mutation fails
- **WHEN** generate endpoint request fails
- **THEN** the system SHALL render an inline error alert in the Generate tab and keep existing inputs/results stable
