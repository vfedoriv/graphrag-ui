## MODIFIED Requirements

### Requirement: Controller pages provide top context plus endpoint tabs
The system SHALL render controller pages with top context/list sections and MAY omit endpoint tabs when the controller workflow is better represented with direct inline sections, and standalone fields/outputs in workflow sections SHALL include explicit purpose labels. The Documents page SHALL omit endpoint tabs and present upload plus action-driven document operations inline. The Schemas page SHALL omit endpoint tabs and present schema operations as purpose-based workflow tabs beneath the schema list.

#### Scenario: Open controller page with simplified inline workflow
- **WHEN** a user navigates to a controller page configured without endpoint tabs
- **THEN** the page SHALL show top context/list and direct inline workflow sections without tab navigation

#### Scenario: Open Schemas page with purpose-based workflow tabs
- **WHEN** a user navigates to the Schemas controller page
- **THEN** the page SHALL show the schemas list first
- **AND** the page SHALL show workflow tabs for schema example generation, schema JSON generation, schema validation, and schema creation
- **AND** the page SHALL NOT render Schemas endpoint tabs

### Requirement: Endpoint tabs map one-to-one with endpoint workflows
The system SHALL provide one tab per endpoint workflow only for controller pages that enable endpoint-tabbed workflows, and each workflow panel SHALL use explicit labels for standalone inputs and text outputs. Controller pages that disable endpoint tabs SHALL keep workflow actions directly accessible inline or through purpose-based tabs without placeholder endpoint tab UI. For the Schemas controller page, schema operations SHALL be grouped into purpose-based workflow tabs instead of endpoint tabs.

#### Scenario: Controller page without tabbed workflows
- **WHEN** a controller page does not enable endpoint tabs
- **THEN** the system SHALL not render empty or placeholder tabs and SHALL keep workflow actions directly accessible

#### Scenario: Schemas workflows are grouped by purpose
- **WHEN** a user opens the Schemas controller page
- **THEN** the page SHALL display purpose-based workflow tabs for schema example generation, schema JSON generation, schema validation, and schema creation
- **AND** the page SHALL keep source-text and source-file variants as source-mode options within the relevant generation tabs
- **AND** the page SHALL NOT require navigating a fixed sequence of endpoint tabs
