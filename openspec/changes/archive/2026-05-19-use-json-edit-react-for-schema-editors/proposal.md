## Why

Schema JSON workflows currently rely on text-oriented editing and formatting cues, which makes structural schema changes error-prone for users who need to add, remove, move, or edit nested nodes. Replacing schema JSON editing surfaces with `json-edit-react` will provide direct object-tree editing while preserving the existing backend JSON contracts.

## What Changes

- Add `json-edit-react` as the interactive editor for user-editable JSON schema areas.
- Allow users to add object/array nodes, remove nodes, move/reorder nodes, and edit primitive values in schema JSON drafts.
- Keep generated and retrieved schema JSON outputs editable before validation or schema creation.
- Preserve JSON validation and create/activate flows against the same serialized schema payloads sent today.
- Surface editor-level parse/validation errors without silently discarding user edits.

## Capabilities

### New Capabilities
- `schema-structured-json-editing`: Covers structured tree editing behavior for schema JSON drafts and outputs.

### Modified Capabilities
- `schema-management-and-activation`: Schema create and validate workflows use a structured schema JSON editor instead of text-only JSON authoring areas.
- `schema-generation-workflow`: Generated and retrieved schema JSON outputs remain editable through the structured editor before follow-up validation or creation.

## Impact

- Adds the `json-edit-react` runtime dependency.
- Affects Schemas page create, validate, generate, file-generate, and get-by-id workflows where schema JSON is authored or edited.
- Affects shared schema editor components if introduced during implementation.
- Does not change backend REST API paths, DTO contracts, or authentication scope.
