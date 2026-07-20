## ADDED Requirements

### Requirement: Release choices keep indicators adjacent to their labels
The system SHALL render checkbox and radio choices in the Release workflow as compact, left-aligned controls, with each native indicator adjacent to its visible label, while preserving semantic label association and existing choice behavior.

#### Scenario: Advisory assessment choice is displayed
- **WHEN** the held-out evaluation stage renders the optional advisory model assessment choice
- **THEN** the checkbox indicator SHALL be left-aligned and adjacent to the `Include advisory model assessment` label
- **AND** selecting the label or checkbox SHALL toggle the advisory option

#### Scenario: Release workflow is viewed at different widths or themes
- **WHEN** a Release checkbox or radio choice is displayed at any supported responsive width or in either supported theme
- **THEN** the indicator and label SHALL remain a visually unified choice without stretching the indicator across the available panel width
