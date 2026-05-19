## 1. Dependency And Editor Wrapper

- [x] 1.1 Add `json-edit-react` to project dependencies and commit the lockfile update.
- [x] 1.2 Create a schema JSON editor wrapper around `JsonEditor` that accepts the app's string draft contract and serializes accepted structured edits back to formatted JSON.
- [x] 1.3 Implement empty-draft initialization, invalid-JSON error display, and draft preservation without coercing invalid content to `{}`.
- [x] 1.4 Apply app-consistent labels, spacing, disabled/error states, and theme styling around the `json-edit-react` editor.

## 2. Schema Workflow Integration

- [x] 2.1 Replace schema validate and create JSON authoring fields with the structured schema JSON editor.
- [x] 2.2 Replace generated schema JSON output editors in text and file generation tabs with the structured editor while keeping generated responses as editable local drafts.
- [x] 2.3 Ensure generated schema output edits can seed the shared schema draft used by later validation or creation.
- [x] 2.4 Preserve existing API request payload contracts for validate, create, and schema generation requests.

## 3. Verification

- [x] 3.1 Update schema editor unit tests for primitive edits, add/remove behavior, invalid draft preservation, and empty draft initialization.
- [x] 3.2 Update schema workflow tests to verify edited structured schema JSON is submitted to validate/create endpoints.
- [x] 3.3 Update generation workflow tests to verify generated schema JSON remains editable after successful generation.
- [x] 3.4 Run `npm run lint`, `npm run test:run`, and `npm run build`.
