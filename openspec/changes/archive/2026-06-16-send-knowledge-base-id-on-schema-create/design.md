## Context

The Schemas page is scoped around the active knowledge base. It loads rows from `GET /api/v1/knowledge-bases/{knowledgeBaseId}/schemas`, and the create mutation currently accepts `knowledgeBaseId` only as mutation context so it can invalidate that scoped query after success.

The backend now extends `CreateSchemaRequest` with optional `knowledgeBaseId`. When supplied, `POST /api/v1/schemas` associates the created schema with that knowledge base before the frontend refetches the scoped list. Without this field, the UI can successfully create a schema but leave it unattached to the active knowledge base.

## Goals / Non-Goals

**Goals:**

- Include the selected knowledge base id in the schema create request body when creating from the Schemas page.
- Keep global schema creation technically possible by making `knowledgeBaseId` optional in the shared request type.
- Preserve existing scoped query invalidation and visible create error handling.
- Cover the request body behavior in API or page workflow tests.

**Non-Goals:**

- Introduce a new create endpoint or change backend routing.
- Change schema activation, update, delete, validation, or generation contracts.
- Optimistically append created schemas to the table.

## Decisions

- Extend `CreateSchemaRequest` with optional `knowledgeBaseId`.
  - Rationale: this mirrors the backend DTO and keeps `schemasApi.create(payload)` as the single typed request boundary.
  - Alternative considered: keep the type unchanged and spread `knowledgeBaseId` at the call site. Rejected because it would hide a supported backend field from the typed API model.
- Build the create payload in `SchemasPage` with `knowledgeBaseId` when `selectedKnowledgeBaseId` exists.
  - Rationale: the page knows the active workspace context and already passes it to the mutation for invalidation.
  - Alternative considered: have `useCreateSchemaMutation` merge `knowledgeBaseId` into `payload`. Rejected because mutation context and request payload would be less explicit at the UI boundary.
- Continue invalidating both global schemas and the selected knowledge-base-scoped schemas query after create.
  - Rationale: the backend remains source of truth for final association and returned schema metadata.

## Risks / Trade-offs

- [Risk] Create may be triggered without an active knowledge base and therefore omit `knowledgeBaseId`. -> Mitigation: keep the field optional and preserve current backend error/response handling.
- [Risk] Tests may only assert endpoint URLs and miss body regressions. -> Mitigation: add or update coverage to inspect the JSON request body for `knowledgeBaseId`.
