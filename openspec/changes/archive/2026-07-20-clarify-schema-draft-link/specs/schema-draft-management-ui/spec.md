## ADDED Requirements

### Requirement: Draft targets clearly expose detail navigation
The system SHALL present each target in the Schema Drafts table as a visually identifiable link to that draft's workbench, using a persistent non-color affordance and distinct hover and keyboard-focus feedback.

#### Scenario: Recognize and open a listed draft
- **WHEN** a knowledge base has one or more schema drafts
- **THEN** each target name and version SHALL be visually distinguishable from non-interactive table values without requiring pointer hover
- **AND** activating the target link SHALL navigate to that draft's existing workbench route

#### Scenario: Focus a draft target with the keyboard
- **WHEN** keyboard navigation moves focus to a target link
- **THEN** the system SHALL show a visible focus indicator
- **AND** the link SHALL retain the target name and version as its accessible name
