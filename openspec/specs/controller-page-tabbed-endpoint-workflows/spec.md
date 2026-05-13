## Purpose

This specification defines required controller-page workflow structure, including tabbed endpoint workflows and explicit field labeling.
## Requirements
### Requirement: Controller pages provide top context plus endpoint tabs
The system SHALL render controller pages with top context/list sections and MAY omit endpoint tabs when the controller workflow is better represented with direct inline sections, and standalone fields/outputs in workflow sections SHALL include explicit purpose labels. The Documents page SHALL omit endpoint tabs and present upload plus action-driven document operations inline.

#### Scenario: Open controller page with simplified inline workflow
- **WHEN** a user navigates to a controller page configured without endpoint tabs
- **THEN** the page SHALL show top context/list and direct inline workflow sections without tab navigation

### Requirement: Endpoint tabs map one-to-one with endpoint workflows
The system SHALL provide one tab per endpoint workflow only for controller pages that enable tabbed workflows, and each workflow panel SHALL use explicit labels for standalone inputs and text outputs. Controller pages that disable endpoint tabs SHALL keep workflow actions directly accessible inline without placeholder tab UI. For the Schemas controller page, the tab sequence SHALL be fixed to: Generate schema example from text, Generate schema example from file, Generate schema YAML, Generate schema YAML from file, Validate schema YAML, Create schema, Get schema by ID.

#### Scenario: Controller page without tabbed workflows
- **WHEN** a controller page does not enable endpoint tabs
- **THEN** the system SHALL not render empty or placeholder tabs and SHALL keep workflow actions directly accessible

#### Scenario: Schemas tab order follows workflow sequence
- **WHEN** a user opens the Schemas controller page
- **THEN** the tab buttons SHALL be displayed in this exact order: Generate schema example from text, Generate schema example from file, Generate schema YAML, Generate schema YAML from file, Validate schema YAML, Create schema, Get schema by ID

### Requirement: Controller workflows MUST show in-flight progress indicators
The system SHALL display a visible progress indicator in the workflow context while endpoint requests are in flight, so users can tell the app is waiting for backend response.

#### Scenario: Endpoint request is running
- **WHEN** a controller workflow action triggers a backend request that has not completed
- **THEN** the page SHALL show an in-context progress indicator (spinner/progress banner/overlay) until completion or failure

