## MODIFIED Requirements

### Requirement: Buttons provide visible hover and press feedback
The system SHALL render prototype-aligned visible visual feedback when users hover over and press interactive buttons, including bordered standard buttons, accent primary buttons, danger buttons, and compact ghost buttons.

#### Scenario: Hover and press a standard button
- **WHEN** a user moves the cursor over a button and then clicks/presses it
- **THEN** the button SHALL display distinct hover and active visual states indicating interaction

#### Scenario: Hover and press a primary button
- **WHEN** a user moves the cursor over an accent primary button and then clicks/presses it
- **THEN** the button SHALL preserve sufficient contrast and SHALL display distinct hover and active visual states matching the prototype visual language

### Requirement: Focus-visible and disabled button states remain clear
The system SHALL provide keyboard focus-visible indication using the prototype accent focus treatment and SHALL keep disabled buttons visually distinct and non-interactive.

#### Scenario: Keyboard and disabled state behavior
- **WHEN** a user tabs to a button or encounters a disabled button
- **THEN** focused buttons SHALL show a visible focus indicator and disabled buttons SHALL not show interactive hover/press behavior

#### Scenario: Disabled current-row action
- **WHEN** a row action is disabled because the row already represents the selected/current item
- **THEN** the action SHALL be visually muted, non-interactive, and still understandable through its label or accessible name

### Requirement: Async action buttons MUST expose pending state
The system SHALL present a visible prototype-aligned pending/loading state for buttons that trigger backend endpoint requests, and SHALL prevent duplicate activation while the request is in progress.

#### Scenario: Trigger async endpoint action
- **WHEN** a user clicks an action button that starts an async backend request
- **THEN** the button SHALL show pending feedback and SHALL be non-interactive until the request settles

#### Scenario: Request settles
- **WHEN** a pending request completes or fails
- **THEN** the button SHALL leave the pending state
- **AND** the workflow SHALL show success or error feedback near the action or output that initiated the request
