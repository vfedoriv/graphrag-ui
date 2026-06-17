## Context

The Schemas page is a controller-oriented page with a knowledge-base-scoped schema list above seven endpoint tabs. That structure exposes every backend endpoint as a separate navigation target, but the resulting page is difficult to scan: common row actions are visually inconsistent, schema IDs dominate the list despite being mostly implementation identifiers, and schema detail retrieval requires copying a row ID into a separate tab.

The current implementation is concentrated in `src/features/schemas/SchemasPage.tsx` with shared primitives for the controller shell, endpoint tabs, table, buttons, inputs, and structured schema JSON editing. The backend contracts are already represented by existing API hooks and should remain unchanged.

## Goals / Non-Goals

**Goals:**

- Make the Schemas list easier to scan by removing the ID column and aligning the actions column.
- Make schema detail retrieval available directly from each schema row.
- Replace the seven endpoint tabs with fewer purpose-based workflow tabs for example generation, schema JSON generation, validation, and creation.
- Let generation tabs choose between text and file source modes and display only the fields for the selected source mode.
- Keep generated and retrieved outputs editable where existing behavior requires it.
- Constrain short text and numeric inputs to content-appropriate widths without breaking responsive layouts.
- Preserve existing API hooks, mutation/query state handling, and knowledge-base scoping.

**Non-Goals:**

- No backend API changes.
- No authentication, authorization, or role behavior.
- No changes to schema JSON structure, validation semantics, activation semantics, update semantics, or delete semantics.
- No new UI framework or dependency.

## Decisions

1. Use purpose-based tabs instead of endpoint tabs for the Schemas page.

   The Schemas page should group workflows by what users are trying to accomplish: generate examples, generate schema JSON, validate schema JSON, and create schema. The existing endpoint-specific controls remain available inside those tabs as source-mode options or workflow actions. This keeps the page less dependent on backend endpoint names while avoiding a long vertical stack of unrelated forms.

   Alternative considered: render all purpose workflows as direct inline sections. That avoids navigation, but it makes the page too long and shows unrelated forms at the same time.

2. Move get-by-id into a schema row details action.

   Listed schemas already carry the identifier required for retrieval, so detail retrieval should be invoked from the row. The result should render in the Schemas page context near the list or in an inline detail panel so users do not copy identifiers between controls.

   Alternative considered: keep a manual get-by-id field and add a row button that pre-fills it. That preserves unnecessary manual-entry UI and still leaves users navigating to a separate area for a row action.

3. Keep schema creation and validation as distinct purpose sections.

   Validation and creation both operate on schema JSON, but creation has different side effects and knowledge-base scoping. Keeping them visually separate avoids treating validation as a required create step while still allowing generated JSON to seed the shared editable draft.

   Alternative considered: merge validation and creation into one "Use schema JSON" panel. That could be efficient for experienced users, but it hides the different backend side effects and error states.

4. Use table-level layout control for stable actions.

   The schema table should reserve a consistent action column and right-size non-action columns. Row action controls should use a stable flex layout or button group so labels do not shift with variable schema names or statuses.

   Alternative considered: individually tune the current table cells. That would likely reproduce the same alignment problem as columns change.

5. Use reusable constrained field styling for short inputs.

   Schema name and version inputs should use max-width classes or a small form-row helper that preserves full-width behavior on narrow screens. This keeps short expected values from spanning the entire panel on desktop while remaining usable on mobile.

   Alternative considered: fixed pixel widths. Fixed widths are brittle for translated labels, larger browser fonts, and smaller viewports.

## Risks / Trade-offs

- [Risk] Removing endpoint tabs may break tests and any internal expectations around `schemas-endpoint-tabs` test IDs. -> Update tests to assert purpose sections and row details behavior instead of tab order.
- [Risk] Users may need to switch between text and file generation variants. -> Keep the source-mode selector at the top of each generation tab and display only the selected variant's fields.
- [Risk] Row detail retrieval can compete visually with update editing, activation, and delete feedback. -> Render only one selected detail panel at a time and label it with schema name/version.
- [Risk] Removing the visible ID column can make troubleshooting harder. -> Keep ID available in details output and in accessible row action context, but do not make it a primary table column.
