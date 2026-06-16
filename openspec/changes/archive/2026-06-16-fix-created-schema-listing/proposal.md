## Why

After a schema is successfully created, it can remain absent from the Schemas page list for the selected knowledge base even after page refresh. The backend shows the schema exists and rejects duplicate name/version creation, so the UI must keep the knowledge-base-scoped schema list aligned with create results and backend filtering.

## What Changes

- Ensure successful schema creation refreshes the same knowledge-base-scoped schema list rendered at the top of the Schemas page.
- Preserve backend contracts: schema creation still uses `POST /api/v1/schemas`, and listing still uses `GET /api/v1/knowledge-bases/{knowledgeBaseId}/schemas`.
- Add regression coverage proving a created schema appears in the selected knowledge base's list when the backend returns it there.
- Keep existing create error handling for duplicate immutable schema versions visible to the user.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-management-and-activation`: Schema creation workflows must refresh and display the selected knowledge base's schema list after successful creation.

## Impact

- Affected frontend files: `src/api/schemas.ts`, `src/features/schemas/SchemasPage.tsx`, and related API/page workflow tests.
- Backend API contracts remain unchanged.
- No dependency or runtime configuration changes are expected.
