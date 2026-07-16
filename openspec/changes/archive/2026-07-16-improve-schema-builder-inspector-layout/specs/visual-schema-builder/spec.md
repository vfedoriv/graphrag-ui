## ADDED Requirements

### Requirement: Builder keeps long element inspectors compact and accessible
The system SHALL prevent metadata, node, or relationship inspector content from unnecessarily expanding the wide-screen Visual Builder workspace, SHALL present description and property controls at a compact usable density, and SHALL preserve access to every inspector field and action.

#### Scenario: Inspect relationship with many properties on a wide screen
- **WHEN** a user selects a relationship whose inspector content is taller than the bounded Visual Builder sidebar
- **THEN** the sidebar SHALL provide its own vertical scrolling so every relationship field, property, and action remains reachable
- **AND** the Visual Builder section SHALL NOT grow to the inspector's full unbounded content height
- **AND** the Raw JSON contract section SHALL follow the useful canvas workspace without a property-list-sized blank area beneath the canvas

#### Scenario: Inspect a compact description field
- **WHEN** the Schema Builder renders schema, node, or relationship description controls
- **THEN** those controls SHALL use a compact initial height appropriate to short descriptions
- **AND** their labels and entered content SHALL remain readable and editable

#### Scenario: Edit properties in the compact inspector
- **WHEN** a selected node or relationship contains multiple properties
- **THEN** the inspector SHALL present each property's name, type, required state, and remove action in a space-efficient layout
- **AND** each control SHALL retain an explicit visible label or accessible name
- **AND** adding, editing, requiring, or removing a property SHALL preserve the existing serialized schema behavior

#### Scenario: Use the inspector on a narrow screen
- **WHEN** the Schema Builder uses its single-column responsive layout
- **THEN** inspector controls SHALL reflow without horizontal clipping
- **AND** the inspector SHALL use normal page scrolling instead of requiring a constrained desktop-style nested scroll region

### Requirement: Builder canvas controls remain visible across themes
The system SHALL render the Schema Builder Zoom In, Zoom Out, Fit View, and Toggle Interactivity controls with theme-appropriate contrast and clear interaction states in every supported appearance theme.

#### Scenario: View canvas controls in dark mode
- **WHEN** the application uses dark mode and the Visual Builder canvas is visible
- **THEN** each canvas control SHALL have a distinguishable surface, border, and icon against the canvas background
- **AND** adjacent controls SHALL remain visually separable

#### Scenario: Interact with canvas controls in either theme
- **WHEN** a user hovers, presses, disables, or keyboard-focuses a canvas control in light or dark mode
- **THEN** the control SHALL provide a visible state appropriate to that interaction
- **AND** the control's accessible name and existing zoom, fit, or interactivity behavior SHALL remain unchanged
