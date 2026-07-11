## ADDED Requirements

### Requirement: Shared visual tokens support light and dark themes
The system SHALL define light and dark values for shared semantic background, surface, foreground, muted, border, accent, status, form-control, focus, and output tokens, and production UI styles SHALL consume those semantic tokens instead of theme-specific literal colors.

#### Scenario: Render a route in either theme
- **WHEN** a user opens any production route with light or dark as the effective theme
- **THEN** the shell, panels, text, controls, tables, tabs, notices, status indicators, and output surfaces SHALL use the corresponding semantic palette

#### Scenario: Render interactive states in dark theme
- **WHEN** a user hovers, presses, focuses, or encounters a disabled shared control while dark theme is effective
- **THEN** the state SHALL remain visually distinguishable and its content SHALL remain legible

### Requirement: Theme palettes preserve accessible readability
The system SHALL maintain sufficient visual contrast for primary and muted text, controls, status feedback, borders, and focus indicators in both supported themes.

#### Scenario: Review representative shared UI in both themes
- **WHEN** representative shared primitives and controller-page states are rendered in light and dark themes
- **THEN** text and state meaning SHALL remain readable without relying solely on color
- **AND** focus indicators SHALL remain visible against their surrounding surfaces
