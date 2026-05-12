## 1. Shared Controller Page Foundation

- [x] 1.1 Add or adapt a reusable controller page shell component with top context/list region and tabbed workflow region.
- [x] 1.2 Define stable tab metadata identifiers and labels for endpoint workflows used across controller pages.
- [x] 1.3 Add shared test IDs/utilities needed to verify controller page and tab rendering behavior.

## 2. Schemas Page Refactor

- [x] 2.1 Keep schemas list/context section fixed at top of Schemas page.
- [x] 2.2 Move schema endpoint actions into tabs: Create schema, Generate schema YAML, Generate schema YAML from file, Generate schema example from text, Generate schema example from file, Get schema by ID, Validate schema YAML.
- [x] 2.3 Ensure schema activation and state refresh remain functional within the new tabbed Schemas workflow.

## 3. Other Controller Page Refactors

- [x] 3.1 Refactor Knowledge Bases page to one controller page with top list/context and endpoint tabs.
- [x] 3.2 Refactor Documents page to one controller page with top list/context and endpoint tabs for upload/processing/inspection workflows.
- [x] 3.3 Refactor Queries page to one controller page with top context and endpoint tabs for ask/execute and related operations.

## 4. Navigation, Routing, and Validation

- [x] 4.1 Update app routing/navigation to map primary entries to controller pages (Schemas, Knowledge Bases, Documents, Queries).
- [x] 4.2 Update or add tests for tab visibility, tab switching, and endpoint workflow accessibility on each controller page.
- [x] 4.3 Run lint/build/tests and fix regressions introduced by the controller-page tabbed layout migration.
