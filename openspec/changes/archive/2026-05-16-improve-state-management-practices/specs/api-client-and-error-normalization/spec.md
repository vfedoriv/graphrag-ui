## ADDED Requirements

### Requirement: API modules expose endpoint workflow hooks
The system SHALL expose typed TanStack Query hooks from API modules for backend endpoint workflows so feature components can consume standardized async state and error behavior.

#### Scenario: Feature component needs to run backend command
- **WHEN** a feature component triggers a backend command such as schema validation, schema generation, schema retrieval, document processing, query generation, query validation, query execution, or ask
- **THEN** the component SHALL consume a typed API-module query or mutation hook for that command

#### Scenario: API endpoint remains reusable outside React
- **WHEN** a test or non-React helper needs the raw API function
- **THEN** the API module MAY keep the raw function exported while production feature components use the hook wrapper
