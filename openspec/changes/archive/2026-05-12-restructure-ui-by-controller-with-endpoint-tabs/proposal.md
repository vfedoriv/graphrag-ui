## Why

The current UI spreads controller endpoints across mixed sections, making endpoint discovery and execution flow harder for users. We need a controller-first information architecture now so users can complete all operations for a controller on one page with predictable vertical flow and tabbed endpoint actions.

## What Changes

- Reorganize the UI to one page per backend controller/domain (Schemas, Knowledge Bases, Documents, Queries).
- Keep each controller page’s list/overview section visible at the top (for example, schema list on Schemas).
- Move endpoint-specific actions into tabs on the same page, one tab per endpoint workflow.
- Standardize tab layout and interaction patterns so every multi-endpoint page behaves consistently.
- Update routing, page composition, and feature components to reflect controller-based grouping.

## Capabilities

### New Capabilities
- `controller-page-tabbed-endpoint-workflows`: Standardized tabbed endpoint interaction model inside each controller page with persistent top summary/list sections.

### Modified Capabilities
- `schema-management-and-activation`: Schemas functionality is regrouped into a single controller page with endpoint tabs (create, generate YAML, generate from file, generate example, get by ID, validate).
- `schema-generation-workflow`: Schema generation operations are exposed as dedicated tabs under Schemas instead of scattered standalone panels.
- `knowledge-base-management`: Knowledge base endpoints are regrouped into one page with vertical controller layout and endpoint tabs.
- `document-ingestion-and-processing`: Document endpoints are regrouped into one page with endpoint tabs tied to document operations.
- `query-authoring-and-execution`: Query endpoints are regrouped into one page with endpoint tabs for ask/execute and related actions.
- `admin-app-shell-and-navigation`: Navigation and route structure are adjusted to enforce one page per controller.

## Impact

- Affected frontend areas: `src/app` routing/shell, `src/features/schemas`, `src/features/knowledge-bases`, `src/features/documents`, `src/features/queries`, shared tab/page layout components.
- API contracts remain unchanged; only presentation and interaction structure changes.
- Requires updates to UI tests for page layout, tab visibility, and endpoint action access paths.
