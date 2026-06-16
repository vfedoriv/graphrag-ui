## 1. API Cache Behavior

- [x] 1.1 Update `useCreateSchemaMutation` to accept mutation variables containing the create payload and an optional selected `knowledgeBaseId`, while keeping `schemasApi.create` request payload unchanged.
- [x] 1.2 Invalidate `queryKeys.schemas()` after successful create as before.
- [x] 1.3 Invalidate `queryKeys.schemasByKnowledgeBase(knowledgeBaseId)` after successful create when a selected knowledge base id is provided.

## 2. Schemas Page Wiring

- [x] 2.1 Pass the selected knowledge base id into the create mutation call from the Schemas page create workflow.
- [x] 2.2 Preserve current disabled/pending/error states for create, including visible conflict feedback when duplicate immutable schema versions are rejected.
- [x] 2.3 Do not optimistically append created schemas to the table; rely on the refetched knowledge-base-scoped list.

## 3. Regression Coverage

- [x] 3.1 Update API hook tests to verify create success invalidates both the global schema list and the selected knowledge-base-scoped schema list.
- [x] 3.2 Add or update Schemas page workflow coverage proving a created schema appears after the scoped list refetch returns it.
- [x] 3.3 Add or preserve coverage showing duplicate create failures remain visible and do not report success.

## 4. Validation

- [x] 4.1 Run the focused schema API and Schemas page tests.
- [x] 4.2 Run `npm run test:run`.
- [x] 4.3 Run `npm run lint`.
