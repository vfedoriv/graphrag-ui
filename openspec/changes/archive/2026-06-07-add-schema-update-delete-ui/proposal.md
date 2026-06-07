## Why

The backend now exposes schema update and delete endpoints, but the frontend only supports creating, validating, activating, generating, and reading schemas. Operators need matching UI controls to maintain schema definitions without leaving the admin app.

## What Changes

- Add frontend API support for `PUT /api/v1/schemas/{schemaId}` and `DELETE /api/v1/schemas/{schemaId}`.
- Add schema list actions to start editing a schema and to request deletion.
- Add an update workflow that loads schema details, displays editable JSON content, saves replacement content, or cancels local edits.
- Add a delete confirmation dialog before calling the backend delete endpoint.
- Surface backend `ProblemDetail` failures for update/delete, including conflicts for active schemas and identity changes.
- Refresh schema list and lookup caches after successful schema update or delete.

## Capabilities

### New Capabilities
- `schema-update-delete-ui`: Covers editing persisted schema JSON content and deleting schemas from the frontend controller UI.

### Modified Capabilities
- `schema-management-and-activation`: Extends schema management requirements from create/list/read/activate to include update and delete actions for persisted schemas.

## Impact

- `src/api/types.ts`: add update request type.
- `src/api/schemas.ts`: add update/delete API functions and TanStack Query mutation hooks.
- `src/features/schemas/SchemasPage.tsx`: add table actions, edit state, save/cancel flow, delete confirmation, pending/error feedback, and cache-aware refresh behavior.
- `src/api/schemas.test.tsx` and schema page tests: cover endpoint methods, payloads, mutation invalidation, update flow, cancel flow, delete confirmation, and error rendering.
- No backend contract changes are introduced by this frontend change.
