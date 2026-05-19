## Context

`SchemaJsonEditor` is the shared UI used by schema validation, creation, and generated schema output flows. It currently wraps `json-edit-react` behind a string-based component contract: callers pass serialized JSON text and receive serialized JSON text back after structured edits.

The user-facing issue is not the API contract. The problem is the editor implementation: `json-edit-react` is difficult for whole-document JSON editing and does not support the clipboard paste workflow users expect when they already have JSON content. The replacement library is `visual-json`, specifically `@visual-json/react` with `@visual-json/core`, whose upstream React package documents a controlled `JsonEditor` component with React 18 or 19 peer support, `value`, `onChange`, `readOnly`, layout props, and optional schema-aware UI.

## Goals / Non-Goals

**Goals:**

- Replace `json-edit-react` with `@visual-json/react` and `@visual-json/core`.
- Preserve the existing `SchemaJsonEditor` public contract: `value` is serialized JSON text and `onChange` receives serialized JSON text.
- Keep structured editing behavior for primitive edits, node addition, node deletion, and movement/reordering where supported by the visual editor.
- Add local Tree View / Raw View controls near each schema JSON editor instance so users can switch between structured editing and direct JSON text editing.
- Use Raw View as the direct-edit and whole-document JSON paste/replacement path, applying valid or invalid text to the same schema draft.
- Preserve invalid pasted JSON text and show a visible parse error until the draft is fixed.
- Keep schema API payloads unchanged: validation and creation still send serialized JSON in `content`.

**Non-Goals:**

- No backend API changes.
- No authentication, authorization, or schema registry contract changes.
- No broader redesign of schema workflow tabs.
- No migration to YAML or JSONC editing in this change.
- No requirement to provide JSON Schema validation hints inside `visual-json`; the initial replacement only needs generic JSON editing.

## Decisions

- Use `@visual-json/react` `JsonEditor` through the existing shared `SchemaJsonEditor` wrapper.

  Rationale: the current app already centralizes schema JSON editing in one component. Keeping the wrapper stable limits the change to one UI primitive plus tests and avoids spreading third-party component props through feature pages.

  Alternative considered: use `visual-json` lower-level `VisualJson`, `TreeView`, and `FormView` primitives immediately. That would provide more layout control but increases implementation surface before proving the replacement solves the paste/edit problem.

- Keep `SchemaJsonEditor` string-controlled instead of converting schema page state to parsed JSON.

  Rationale: schema validation, creation, and generated output flows already consume serialized JSON strings and need invalid-draft preservation. A parsed-only state model would either discard invalid text or require feature pages to hold parallel raw/parsed state.

  Alternative considered: make feature pages store `JsonValue` and serialize only on submit. That simplifies the visual editor integration but breaks the current invalid JSON fallback behavior and requires wider workflow changes.

- Add a local Tree View / Raw View switch inside `SchemaJsonEditor`.

  Rationale: every schema workflow uses the same shared component, and the switch belongs next to the specific JSON content the user is editing. Keeping the control inside the wrapper ensures validation, creation, and generation output editors all get the same view-style affordance without duplicating page-level state.

  Alternative considered: add page-level buttons around each component usage. That would satisfy placement but duplicates behavior across schema tabs and increases the chance that one editor instance misses the switch.

- Use Raw View as the whole-document text editing lane.

  Rationale: Raw View gives users predictable browser textarea behavior for direct JSON edits and clipboard paste. Tree View remains the structured `visual-json` surface for node-level editing when the draft parses successfully.

  Alternative considered: provide a separate paste-only control in addition to Tree View and Raw View. That creates three editing modes for the same content and is less clear than making Raw View the explicit direct-edit mode.

- Treat disabled state as read-only for both Tree View and Raw View controls.

  Rationale: schema generation flows disable editors while requests are pending. Both view styles must respect that to avoid state changes while the request lifecycle is in progress.

## Risks / Trade-offs

- `visual-json` is a newer dependency with a smaller ecosystem than mature text editors -> Keep the integration behind `SchemaJsonEditor` so rollback or another editor replacement remains isolated.
- Tree View / Raw View introduces two editing lanes -> Keep labels explicit and colocate the switch with each schema JSON editor instance.
- Invalid pasted JSON cannot render in the visual editor -> Preserve the raw text in the existing textarea fallback and show the parse error until the user fixes it.
- Third-party CSS/theming may not match existing controller UI by default -> Wrap the editor in the existing card/border styles and apply local CSS variables or class overrides only inside `SchemaJsonEditor`.
- Tests could become coupled to third-party DOM -> Continue mocking `@visual-json/react` in Vitest and assert the wrapper contract rather than internal library markup.

## Migration Plan

1. Replace `json-edit-react` dependencies with `@visual-json/react` and `@visual-json/core` using npm so the lockfile is updated consistently.
2. Update `SchemaJsonEditor` to parse valid serialized text into a controlled `JsonEditor` value and serialize `onChange` values back to pretty JSON.
3. Add the colocated Tree View / Raw View switch and use Raw View for direct JSON editing, whole-document paste/replacement, and invalid JSON fallback behavior.
4. Replace the Vitest mock for `json-edit-react` with an `@visual-json/react` mock that exercises value changes and read-only behavior.
5. Update schema editor and schema page tests to assert the new test IDs/labels and paste workflow.
6. Run `npm run lint`, `npm run test:run`, and `npm run build` for validation.

Rollback is straightforward: restore `json-edit-react` dependency and the previous `SchemaJsonEditor` implementation if `visual-json` introduces blocking runtime issues before release.
