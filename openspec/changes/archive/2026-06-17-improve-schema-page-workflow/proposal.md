## Why

The Schemas page currently exposes too much endpoint-level detail at once, making common schema management tasks harder to scan and causing layout problems in the schema list and form controls. The schema ID column and separate get-by-id tab create copy/paste work for users even though schema detail retrieval is naturally tied to a listed schema row.

## What Changes

- Remove the schema ID column from the Schemas list table and keep the list focused on human-readable schema metadata.
- Align row action controls consistently so activation, update, delete, and detail actions do not shift based on preceding column widths.
- Replace the crowded endpoint tab list on the Schemas page with purpose-based workflow tabs for:
  - schema example generation
  - schema JSON generation
  - schema validation
  - schema creation
- Keep text/file generation variants behind source-mode options inside the relevant generation tabs instead of rendering both variants side by side.
- Move get schema by ID from a standalone manual-entry workflow into a per-row action on the schema list.
- Size short form controls, such as schema name and schema version, to sensible content-oriented widths while preserving responsive behavior.
- Keep backend contracts unchanged and continue using same-origin `/api` requests.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `schema-management-and-activation`: Schema list presentation and schema detail retrieval behavior change on the Schemas page.
- `schema-generation-workflow`: Schema generation workflows remain available but are grouped by user purpose instead of endpoint tabs.
- `controller-page-tabbed-endpoint-workflows`: The Schemas controller page changes from fixed endpoint tabs to direct purpose-based workflow sections.

## Impact

- Affected UI code under `src/features/schemas` and any shared form/table primitives used by the Schemas page.
- Affected tests covering schema list rendering, schema row actions, schema workflow navigation, get-by-id behavior, and short field sizing.
- No backend API contract changes, new dependencies, authentication changes, or deployment configuration changes.
