# controller-page-tabbed-endpoint-workflows Specification

## Purpose
TBD - created by archiving change restructure-ui-by-controller-with-endpoint-tabs. Update Purpose after archive.
## Requirements
### Requirement: Controller pages provide top context plus endpoint tabs
The system SHALL render each controller page as a vertical layout with a persistent top context/list section and a tabbed endpoint-actions section beneath it.

#### Scenario: Open controller page with multiple endpoint workflows
- **WHEN** a user navigates to a controller page that supports multiple endpoint operations
- **THEN** the page SHALL show the top context/list section first and render endpoint workflows as labeled tabs below it

### Requirement: Endpoint tabs map one-to-one with endpoint workflows
The system SHALL provide one tab per endpoint workflow and SHALL render only that workflow in the active tab panel.

#### Scenario: Switch between endpoint tabs
- **WHEN** a user selects a different endpoint tab on a controller page
- **THEN** the system SHALL activate the selected tab and display the corresponding endpoint workflow panel

