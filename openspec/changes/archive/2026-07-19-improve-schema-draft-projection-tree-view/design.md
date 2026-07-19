## Context

The Projection section receives the effective schema as an opaque JSON-compatible value. Its default Readable view currently groups only the top-level keys and prints every nested value as JSON, while schema create and update workflows use `@visual-json/react` through `SchemaJsonEditor` to provide an expandable tree. Projection data is derived and must remain read-only; the Structured JSON mode must continue to expose the exact formatted payload.

## Goals / Non-Goals

**Goals:**

- Present the effective projection with the same tree semantics users already encounter in schema workflows.
- Reuse one shared configuration for tree values, counts, sidebar behavior, sizing, and read-only state.
- Preserve a distinct Structured JSON view and the existing revision/readiness context.
- Make read-only behavior explicit and testable.

**Non-Goals:**

- Editing or replacing an effective projection.
- Changing projection API contracts, validation, publication behavior, or review workflows.
- Changing editable Schema JSON Tree View and Raw View semantics.
- Adding a new visualization dependency or a schema-specific domain renderer.

## Decisions

### Extract a shared JSON tree presentation

Create a small shared component around `@visual-json/react`'s `JsonEditor` configuration and use it from both `SchemaJsonEditor` and the Projection section. The component will accept a JSON value, accessible label, sizing, read-only state, and an optional change callback. Projection will always pass read-only mode and no mutation path; editable schema workflows will retain their existing callback.

This avoids duplicating third-party configuration and visual behavior. Reusing the entire `SchemaJsonEditor` was considered, but rejected because that component owns editable string parsing, empty-value initialization, and Tree View/Raw View controls that do not match a derived projection.

### Keep projection modes conceptually separate

The Projection section will retain its Readable view and Structured JSON modes. Readable view will render the shared tree presentation by default; Structured JSON will render the formatted projection in the existing code block. Switching modes changes presentation only and must not transform or update the query result.

Renaming the projection modes to the editable editor's Tree View and Raw View was considered, but retaining the existing projection terminology better distinguishes an inspect-only payload from an editing surface while still delivering the requested tree presentation.

### Treat the projection as read-only JSON with a safe fallback

The backend contract exposes `schema` as `unknown`, even though successful responses are expected to carry JSON data. The Projection section will pass JSON-compatible values to the tree. If a value cannot be represented safely by the tree, it will fall back to the formatted read-only preview rather than throwing and breaking the workbench.

### Test behavior through stable public signals

Shared-component tests will preserve coverage of editable and disabled behavior. Projection workflow tests will verify that Readable view shows the tree in read-only mode, Structured JSON shows the formatted payload, and switching between them does not expose an editing path. Tests will rely on accessible labels, pressed/toggle state, and the existing mocked visual editor rather than internal third-party DOM structure.

## Risks / Trade-offs

- **[Risk] Extracting the shared wrapper could regress existing editable schema workflows.** → Keep `SchemaJsonEditor` parsing and mode state unchanged, preserve its current props, and run its focused tests plus schema workflow tests.
- **[Risk] Large projections may make an expanded tree expensive or visually tall.** → Use the visual editor's existing navigation, counts, and bounded panel sizing rather than recursively rendering custom DOM.
- **[Risk] The `unknown` response type may contain a non-JSON value in tests or future integrations.** → Validate tree compatibility at the presentation boundary and retain the formatted preview fallback.
- **[Trade-off] A generic tree is less domain-specific than a node/relationship visualization.** → Prefer consistency and complete payload fidelity for this focused usability change; a domain visualization remains out of scope.
