## Why

The Schema Drafts workbench currently labels the projection's default mode as readable, but renders each top-level value as formatted JSON, which remains difficult to scan for nested nodes, properties, and relationships. Reusing the established schema tree presentation will make projected schemas easier to inspect and keep schema viewing behavior consistent across the application.

## What Changes

- Render the Schema Drafts workbench Projection section's Readable view as an expandable, read-only tree with visible nested values and collection counts.
- Preserve the Structured JSON mode for inspecting the exact formatted projection payload.
- Keep projection content non-editable and continue directing changes through candidate decisions and conflict resolutions.
- Cover the projection view toggle, tree rendering, and read-only behavior with focused UI tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Strengthen the effective-projection viewing requirement so its readable mode uses the application's schema tree presentation while structured JSON remains available as a separate exact-payload view.

## Impact

- Affects the Projection section in `src/features/schema-drafts/SchemaDraftsPage.tsx` and its tests.
- May extract or extend a shared read-only tree presentation from `src/shared/ui/SchemaJsonEditor.tsx` so Schema Drafts and Schemas use consistent visual behavior without enabling projection edits.
- Uses the existing `@visual-json/react` dependency; no backend API, DTO, routing, or deployment changes are required.
