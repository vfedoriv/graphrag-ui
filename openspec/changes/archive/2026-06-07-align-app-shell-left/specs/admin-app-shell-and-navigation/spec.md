## ADDED Requirements

### Requirement: Admin shell uses left-anchored responsive workspace layout
The system SHALL lay out the admin workspace so the primary navigation panel is aligned near the left side of the viewport with a fixed desktop width, and the main content region SHALL flex to use the remaining viewport width while preserving usable internal spacing and avoiding horizontal page overflow.

#### Scenario: Wide desktop viewport uses available width
- **WHEN** a user views any controller page on a wide desktop viewport
- **THEN** the primary navigation panel SHALL remain fixed-width and left-aligned
- **AND** the main content region SHALL expand into the available space to the right instead of keeping the entire shell centered with large side gutters

#### Scenario: Browser width changes
- **WHEN** the browser viewport is resized between common desktop widths
- **THEN** the primary navigation panel SHALL keep a stable width
- **AND** the main content region SHALL grow or shrink with the remaining viewport width

#### Scenario: Narrow viewport remains usable
- **WHEN** the browser viewport is too narrow for the desktop two-column shell
- **THEN** the layout SHALL remain usable without horizontal page overflow caused by the shell container
