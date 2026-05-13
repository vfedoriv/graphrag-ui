## Why

The current Schemas tab order does not match the preferred workflow sequence, making users jump between actions when creating schemas from examples and then validating/creating. Reordering improves task flow clarity and reduces unnecessary navigation.

## What Changes

- Reorder tabs on the Schemas page to the following fixed order:
  - Generate schema example from text
  - Generate schema example from file
  - Generate schema YAML
  - Generate schema YAML from file
  - Validate schema YAML
  - Create schema
  - Get schema by ID
- Keep existing tab functionality and content unchanged; this is ordering-only behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `controller-page-tabbed-endpoint-workflows`: Define and enforce a deterministic, workflow-oriented tab order for the Schemas controller page.

## Impact

- Affected code: `src/features/schemas/SchemasPage.tsx` tab configuration order.
- No API contract changes.
- No dependency changes.
- Minimal test updates may be needed where tab order assertions exist.
