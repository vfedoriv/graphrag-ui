## Purpose

Define user-facing appearance selection, persistence, system preference synchronization, and application-wide theme resolution for the GraphRAG admin UI.

## Requirements

### Requirement: Application supports light, dark, and system appearance preferences
The system SHALL allow a user to select `light`, `dark`, or `system` appearance, and SHALL use `system` when no valid stored preference exists.

#### Scenario: First visit follows system preference
- **WHEN** a user opens the application without a valid stored appearance preference
- **THEN** the system SHALL select the system appearance option
- **AND** the effective theme SHALL match the operating-system color-scheme preference

#### Scenario: User selects an explicit theme
- **WHEN** a user selects light or dark appearance
- **THEN** the system SHALL immediately apply the selected theme across the application
- **AND** the selected appearance option SHALL be programmatically identifiable

### Requirement: Appearance preference persists locally
The system SHALL store a valid user-selected appearance preference in browser-local storage and restore it on later visits without requiring a backend request.

#### Scenario: Restore a saved preference
- **WHEN** a user returns after previously selecting an appearance option
- **THEN** the system SHALL restore that option and its resolved theme

#### Scenario: Stored preference is invalid or unavailable
- **WHEN** stored appearance data is invalid or browser storage cannot be read
- **THEN** the application SHALL remain usable and fall back to the system appearance option

### Requirement: System appearance remains synchronized
The system SHALL update the effective theme when the operating-system color-scheme preference changes while the selected appearance option is `system`.

#### Scenario: System color scheme changes in system mode
- **WHEN** the selected appearance option is system and the operating system changes between light and dark
- **THEN** the application SHALL update to the corresponding effective theme without a page reload

#### Scenario: System color scheme changes with explicit preference
- **WHEN** the selected appearance option is light or dark and the operating-system preference changes
- **THEN** the effective application theme SHALL remain the explicitly selected theme

### Requirement: Correct theme is applied before application paint
The system SHALL resolve and mark the document with the effective theme before the React application renders, and SHALL expose the matching browser `color-scheme`.

#### Scenario: Load with saved dark appearance
- **WHEN** the application loads with a valid saved dark preference
- **THEN** the document SHALL be marked for the dark theme before application content renders
- **AND** the browser color scheme SHALL be dark
