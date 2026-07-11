## ADDED Requirements

### Requirement: Admin shell exposes appearance selection
The system SHALL provide a labeled appearance control in the shared admin shell that offers light, system, and dark options on every application route.

#### Scenario: Change appearance from a controller route
- **WHEN** a user selects an appearance option from the shell on any controller route
- **THEN** the system SHALL apply that preference without navigating away or resetting the selected knowledge-base context

#### Scenario: Operate appearance control with a keyboard
- **WHEN** a keyboard user focuses and operates the shell appearance control
- **THEN** all appearance options SHALL be reachable and selectable
- **AND** focus and selected states SHALL be visibly and programmatically identifiable

#### Scenario: Use appearance control on a narrow viewport
- **WHEN** a user views the stacked shell on a narrow viewport
- **THEN** the appearance control SHALL remain visible and usable without causing horizontal page overflow
