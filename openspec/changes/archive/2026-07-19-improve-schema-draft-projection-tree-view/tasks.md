## 1. Shared Tree Presentation

- [x] 1.1 Extract a reusable JSON tree presentation from `SchemaJsonEditor`, preserving the current visual editor configuration, sizing, accessible labeling, and editable/read-only behavior.
- [x] 1.2 Update `SchemaJsonEditor` to use the shared tree component without changing its Tree View, Raw View, parsing, initialization, or disabled-state behavior.
- [x] 1.3 Add or update focused shared UI tests for editable and read-only tree behavior.

## 2. Projection Readable View

- [x] 2.1 Replace the Projection section's top-level details and JSON previews with the shared read-only tree for JSON-compatible projection values, retaining a safe formatted fallback.
- [x] 2.2 Preserve the Readable view and Structured JSON toggle, revision/readiness badges, exact formatted JSON payload, and derived-projection guidance without introducing a mutation path.
- [x] 2.3 Extend Schema Drafts workflow tests to verify the default read-only tree, Structured JSON switching, unchanged projection content, and the no-current-aggregate state.

## 3. Validation

- [x] 3.1 Run focused `SchemaJsonEditor` and `SchemaDraftsPage` tests and resolve regressions.
- [x] 3.2 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
