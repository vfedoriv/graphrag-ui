## 1. API Contract

- [x] 1.1 Add optional `knowledgeBaseId` to `CreateSchemaRequest`.
- [x] 1.2 Ensure `schemasApi.create` serializes `knowledgeBaseId` when present without changing the endpoint path.

## 2. Schema Create Workflow

- [x] 2.1 Update the Schemas page create action to include the selected knowledge base id inside the create request payload.
- [x] 2.2 Preserve existing create pending, success invalidation, and error feedback behavior.

## 3. Tests

- [x] 3.1 Update API or Schemas page tests to verify `POST /api/v1/schemas` includes `knowledgeBaseId` when a knowledge base is selected.
- [x] 3.2 Run focused schema tests and the normal validation commands appropriate for the implementation scope.
