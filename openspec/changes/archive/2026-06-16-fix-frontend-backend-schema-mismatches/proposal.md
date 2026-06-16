## Why

The frontend API models have drifted from the backend DTO contract in a few recently changed response shapes. This causes incomplete UI output for hybrid search graph relationships, hides schema generation warnings, and leaves backend `ProblemDetail.errors` shapes typed more narrowly than the backend actually returns.

## What Changes

- Align frontend schema generation response types with the backend `GenerateSchemaResponse` by including non-blocking `warnings`.
- Render schema generation warnings in both text-based and file-based schema JSON generation workflows.
- Align hybrid search DTOs and rendering with the backend response shape, including `graph`, `startNodeElementId`, and `endNodeElementId`.
- Update hybrid search tests and fixtures to use backend-shaped responses instead of mock-only aliases.
- Broaden API client `ProblemDetail.errors` handling so validation maps, request-level error lists, and field string messages normalize safely.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-generation-workflow`: Schema generation workflows must surface backend advisory warnings returned with generated schema content.
- `query-authoring-and-execution`: Hybrid search result rendering must display graph context using the backend DTO field names.
- `api-client-and-error-normalization`: API types and normalization must support the backend's actual `ProblemDetail.errors` variants and backend-shaped hybrid search responses.

## Impact

- Affected frontend files: `src/api/types.ts`, `src/api/client.ts`, `src/api/schemas.ts`, `src/api/queries.ts`, `src/features/schemas/SchemasPage.tsx`, `src/features/queries/QueriesPage.tsx`, and related tests.
- Backend API contracts remain unchanged; this is a frontend alignment change.
- No dependency or runtime configuration changes are expected.
