## Why

The backend now accepts `knowledgeBaseId` on `POST /api/v1/schemas` and uses it to associate newly created schemas with a workspace/knowledge base. The frontend currently tracks the selected knowledge base for cache invalidation, but does not include it in the create request body, so newly created schemas may not be associated with the active knowledge base.

## What Changes

- Include the active knowledge base id in schema create request payloads when a schema is created from the Schemas page.
- Update the typed create-schema request model to include optional `knowledgeBaseId`.
- Preserve existing create behavior when no knowledge base is selected, including current validation/error handling.
- Add regression coverage proving create requests include `knowledgeBaseId` when the user has an active knowledge base.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-management-and-activation`: Schema creation from the Schemas page must submit the active knowledge base id so backend-created schemas are associated with the selected knowledge base.

## Impact

- Affected frontend files: `src/api/types.ts`, `src/api/schemas.ts`, `src/features/schemas/SchemasPage.tsx`, and related API/page tests.
- Affected backend contract: `POST /api/v1/schemas` accepts optional `knowledgeBaseId` in the JSON request body.
- No new dependencies or backend changes are required in this repository.
