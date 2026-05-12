## MODIFIED Requirements

### Requirement: Controller pages provide top context plus endpoint tabs
The system SHALL render controller pages with top context/list sections and MAY omit endpoint tabs when the controller workflow is better represented with direct inline sections, and standalone fields/outputs in workflow sections SHALL include explicit purpose labels. The Documents page SHALL omit endpoint tabs and present upload plus action-driven document operations inline.

#### Scenario: Open controller page with simplified inline workflow
- **WHEN** a user navigates to a controller page configured without endpoint tabs
- **THEN** the page SHALL show top context/list and direct inline workflow sections without tab navigation

### Requirement: Endpoint tabs map one-to-one with endpoint workflows
The system SHALL provide one tab per endpoint workflow only for controller pages that enable tabbed workflows, and each workflow panel SHALL use explicit labels for standalone inputs and text outputs. Controller pages that disable endpoint tabs SHALL keep workflow actions directly accessible inline without placeholder tab UI.

#### Scenario: Controller page without tabbed workflows
- **WHEN** a controller page does not enable endpoint tabs
- **THEN** the system SHALL not render empty or placeholder tabs and SHALL keep workflow actions directly accessible
