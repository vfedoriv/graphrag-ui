## 1. Dependencies

- [x] 1.1 Remove `json-edit-react` from npm dependencies.
- [x] 1.2 Add `@visual-json/react` and `@visual-json/core` with npm and commit the lockfile changes.
- [x] 1.3 Confirm the installed package exports the React `JsonEditor` API used by the wrapper.

## 2. SchemaJsonEditor Implementation

- [x] 2.1 Replace the `json-edit-react` import and props with `@visual-json/react` `JsonEditor` in `src/shared/ui/SchemaJsonEditor.tsx`.
- [x] 2.2 Keep the wrapper contract string-based by parsing `value` into JSON for the editor and serializing editor changes back through `onChange`.
- [x] 2.3 Preserve the empty-draft initialization behavior by normalizing blank input to `{}`.
- [x] 2.4 Add colocated Tree View and Raw View controls inside `SchemaJsonEditor` so every usage can switch view style next to the editor instance.
- [x] 2.5 Implement Tree View with `visual-json` for structured editing when the draft parses successfully.
- [x] 2.6 Implement Raw View with direct JSON text editing and clipboard paste behavior that updates the same schema draft.
- [x] 2.7 Preserve invalid pasted or typed JSON in Raw View and show a visible parse error without discarding the draft.
- [x] 2.8 Ensure `disabled` maps to read-only editor behavior and disables Raw View edits.
- [x] 2.9 Keep the editor and view switch controls visually aligned with existing shared UI primitives and controller page styling.

## 3. Tests

- [x] 3.1 Replace the global Vitest mock for `json-edit-react` with an `@visual-json/react` mock that exercises controlled value changes and read-only behavior.
- [x] 3.2 Update `SchemaJsonEditor` tests for primitive edits, add/remove/move-style updates, empty draft initialization, invalid draft preservation, and disabled behavior.
- [x] 3.3 Add tests for switching from Tree View to Raw View without changing valid draft content.
- [x] 3.4 Add tests for editing or pasting valid complete JSON in Raw View and rendering it back through Tree View.
- [x] 3.5 Add tests for pasting invalid complete JSON in Raw View and preserving the raw invalid draft with a parse error.
- [x] 3.6 Add tests that disabled editors prevent Raw View edits and structured editor changes.
- [x] 3.7 Update schema page tests that assert old `json-edit-react` test IDs or labels and verify view switch controls are present near schema editor usages.

## 4. Validation

- [x] 4.1 Run `npm run lint`.
- [x] 4.2 Run `npm run test:run`.
- [x] 4.3 Run `npm run build`.
