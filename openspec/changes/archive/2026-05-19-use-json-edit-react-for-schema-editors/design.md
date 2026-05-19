## Context

Schema workflows currently store schema JSON drafts as strings and render them through `StructuredPayloadEditor`, a JSON-aware textarea wrapper with a formatting action. Generated schema JSON outputs and get-by-id schema details are also string-based, and backend calls expect serialized JSON content strings.

`json-edit-react` provides a controlled `JsonEditor` component imported from `json-edit-react`, accepts object data through `data` and `setData`, and supports update callbacks such as `onUpdate`, `onEdit`, `onDelete`, and `onAdd`. Its editor can be themed and used to validate or reject changes before accepting them.

## Goals / Non-Goals

**Goals:**
- Provide structured editing for schema JSON areas where users author, validate, create, generate, or inspect schema JSON.
- Preserve the current string payload contract for schema API requests.
- Allow users to add, remove, move/reorder, and edit schema JSON nodes without hand-editing raw JSON text.
- Keep existing pending, success, failure, and draft-preservation behavior in schema workflows.
- Keep generated schema JSON editable before validation or creation.

**Non-Goals:**
- Changing backend DTOs, REST paths, or schema validation semantics.
- Replacing non-schema JSON editors such as query parameter JSON fields.
- Adding authentication, authorization, or backend schema migration behavior.
- Building a custom tree editor when the external dependency provides the needed behavior.

## Decisions

1. Use `json-edit-react` behind a shared schema JSON editor wrapper.

   The implementation should add a wrapper component for schema JSON editing, likely near `src/shared/ui` or `src/features/schemas`, that imports `JsonEditor` from `json-edit-react`. The wrapper should expose the app's current string draft contract (`value: string`, `onChange: (value: string) => void`) while internally parsing to object data for the editor and serializing accepted edits back to a formatted JSON string.

   Alternative considered: replace each schema textarea directly with `JsonEditor`. A wrapper keeps API-bound string behavior centralized, simplifies tests, and avoids repeating parse/error handling across tabs.

2. Treat parse failures as explicit editor errors and preserve the original string.

   When a current draft cannot be parsed, the wrapper should render an error state and avoid replacing the draft with `{}` or another fallback. Users must not lose their current text because a parse failed. For empty drafts, the wrapper can initialize to an empty object suitable for first-time schema editing.

   Alternative considered: always coerce invalid or empty JSON to `{}`. That is simpler, but it can silently discard user input and conflicts with existing draft-preservation requirements.

3. Keep API integration string-based at workflow boundaries.

   Create and validate calls should continue sending `{ content: schemaJson }`, and generation callbacks should continue seeding string drafts from backend `content`. The structured editor is a UI affordance, not a contract change.

   Alternative considered: convert schema workflow state to object data. That would reduce serialization inside the editor but creates broader churn in API payload assembly and tests without changing backend requirements.

4. Scope structured editing to schema JSON, not generic JSON fields.

   Query parameter JSON remains under its current format-aware editor unless a separate product decision broadens the behavior. Schema JSON has deeper structural editing needs because users work with nested schema definitions.

   Alternative considered: replace every JSON editor in the app. That expands behavior beyond the request and risks changing query submission semantics.

5. Cover library integration with focused tests.

   Tests should verify that schema JSON editors render structured controls, accepted primitive edits update the serialized draft, generated output remains editable, and create/validate submit the edited serialized JSON. If direct drag-and-drop movement is difficult to test in jsdom, cover move/reorder behavior at the wrapper callback or component contract level and leave full browser coverage for later E2E work.

   Alternative considered: rely only on manual verification. The dependency changes critical schema workflows, so automated coverage is warranted.

## Risks / Trade-offs

- `json-edit-react` UI or accessibility semantics may differ from the app's shared textarea controls -> wrap it in app labels, error text, and controller-page spacing so it fits existing forms.
- Large schemas may be heavier to render as editable trees than as text -> keep the wrapper scoped to schema areas and avoid unnecessary remounts by preserving local state carefully.
- Invalid raw JSON drafts cannot be represented as tree data -> surface parse errors and retain the string instead of coercing it.
- Move/reorder interactions may be hard to validate in unit tests -> test callback/state behavior in unit tests and reserve pointer-level interaction coverage for Playwright if needed.
- Dependency upgrades may alter editor behavior -> pin through `package-lock.json` and keep wrapper tests focused on app-level behavior.

## Migration Plan

1. Add `json-edit-react` to dependencies.
2. Introduce a schema JSON editor wrapper with parse, serialization, error, and accessibility handling.
3. Replace schema JSON authoring/editing areas in Schemas workflows with the wrapper.
4. Update schema workflow tests to assert structured editing behavior and unchanged API payload contracts.
5. Run lint, unit tests, coverage when appropriate, and build.

Rollback is limited to reverting the dependency and restoring the previous `StructuredPayloadEditor` or textarea usage in schema workflows.
