## Why

The current schema JSON editor uses `json-edit-react`, which makes direct JSON editing awkward and does not support pasting full JSON from the clipboard in the workflow users need. Schema authoring should allow both structured tree editing and fast whole-document JSON replacement without forcing users through a component that blocks common clipboard input.

## What Changes

- Replace the `json-edit-react` dependency with `visual-json` for schema JSON editing.
- Preserve the existing structured JSON editing behavior for schema validation, creation, and generated schema output review.
- Add a Tree View / Raw View switch near each schema JSON editor instance so users can choose structured editing or direct JSON text editing in place.
- Add a Raw View path for pasting complete JSON from the clipboard and applying it to the same schema draft.
- Preserve invalid pasted JSON as editable draft text and surface a visible parse error instead of discarding user input.
- Remove test mocks and implementation references tied to `json-edit-react`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `schema-structured-json-editing`: Require schema JSON editing to support Tree View / Raw View switching and whole-document clipboard paste/replacement in addition to structured node editing, while keeping API payloads serialized through the existing `content` field.

## Impact

- `package.json` and lockfile dependencies change from `json-edit-react` to `@visual-json/react` and `@visual-json/core`.
- `src/shared/ui/SchemaJsonEditor.tsx` changes implementation while retaining the shared component contract used by schema workflows and exposing local view-style controls where the component is rendered.
- Tests and shared mocks that assert `json-edit-react` behavior or test IDs need updates for the new editor integration and paste flow.
- No backend API contract changes are expected; schema validation, creation, and generation requests continue using same-origin `/api/v1` calls and existing DTO fields.
