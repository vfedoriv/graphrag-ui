## 1. API Layer

- [x] 1.1 Add `UpdateSchemaRequest` type with `content` and optional supported `sourceType`.
- [x] 1.2 Add `schemasApi.update(schemaId, payload)` using `PUT /schemas/{schemaId}` and returning schema details.
- [x] 1.3 Add `schemasApi.delete(schemaId)` using `DELETE /schemas/{schemaId}` and expecting an empty response.
- [x] 1.4 Add update and delete mutation hooks with invalidation for all schema lists, selected knowledge-base schema lists, and affected schema lookup/detail keys.

## 2. Schemas Page Workflow

- [x] 2.1 Add update and delete actions to schema list rows while preserving existing activation behavior.
- [x] 2.2 Implement update row action to fetch schema details and open an isolated editable schema JSON draft.
- [x] 2.3 Implement Save for updates, including pending state, success feedback, cache refresh, and visible error feedback that preserves the draft.
- [x] 2.4 Implement Cancel for updates so local draft state is discarded without calling the backend.
- [x] 2.5 Implement delete confirmation dialog that identifies the selected schema and supports confirm/cancel.
- [x] 2.6 Implement confirmed delete behavior with pending state, success close/refresh, and visible error feedback for backend conflicts or other failures.

## 3. Tests

- [x] 3.1 Extend schema API tests to verify update/delete endpoint paths, HTTP methods, payload shape, empty delete response handling, and mutation invalidation.
- [x] 3.2 Add schema page workflow tests for starting update, loading content, saving edits, and preserving drafts on update failure.
- [x] 3.3 Add schema page workflow tests for canceling update without a `PUT` request.
- [x] 3.4 Add schema page workflow tests for delete confirmation, confirm calling `DELETE`, cancel avoiding `DELETE`, and delete failure alert rendering.
- [x] 3.5 Update existing schema tab/list tests for the added table actions without weakening current generate, validate, create, get-by-id, and activate coverage.

## 4. Validation

- [x] 4.1 Run `npm run lint`.
- [x] 4.2 Run `npm run test:run`.
- [x] 4.3 Run `npm run build`.
