## Context

The Schemas page renders the schema list from the selected knowledge base using `GET /api/v1/knowledge-bases/{knowledgeBaseId}/schemas`. Schema creation uses the global `POST /api/v1/schemas` endpoint and the current create mutation only invalidates the global schema query key. That leaves the visible knowledge-base-scoped list stale even when the backend has created the schema and later rejects duplicate name/version creation.

The backend contract remains source of truth for schema association and immutability. The frontend should not infer success from the create response alone; it should refresh the list query that the page actually displays.

## Goals / Non-Goals

**Goals:**
- Refresh the selected knowledge base's schema list after successful schema creation.
- Keep the visible list aligned with the backend's knowledge-base-scoped listing endpoint.
- Add regression tests for create success invalidation and page-level list refresh behavior.
- Preserve current create error feedback, including conflict responses for duplicate immutable schema versions.

**Non-Goals:**
- Changing backend schema creation, association, or duplicate-version semantics.
- Adding client-side schema deduplication or optimistic insertion into the knowledge-base list.
- Changing how schemas are activated, updated, deleted, generated, or validated.

## Decisions

- Pass the selected knowledge base id through the create mutation variables when creation is launched from the Schemas page.
  - Rationale: create remains a global endpoint, but the UI context knows which scoped list is visible and should be refreshed.
  - Alternative considered: invalidate every `schemasByKnowledgeBase` query. Rejected because it refreshes unrelated knowledge base lists and can create avoidable network traffic.
- Invalidate both the global schemas key and the selected knowledge-base-scoped schemas key after create success.
  - Rationale: this preserves existing global-cache behavior while fixing the rendered list cache.
  - Alternative considered: rely on full page reload. Rejected because the active page should become consistent immediately after a successful mutation, and browser refresh still depends on the same query behavior.
- Prefer backend refetch over optimistic insertion.
  - Rationale: the backend determines whether the created schema belongs to the selected knowledge base and what status/hash metadata it returns in the scoped list.
  - Alternative considered: manually append the create response to the list. Rejected because create response shape may not include all list metadata or scoped association status.

## Risks / Trade-offs

- [Risk] A created schema might not be associated with the currently selected knowledge base by backend rules. -> Mitigation: refetch the scoped list and display exactly what the backend returns rather than forcing the row into the UI.
- [Risk] Existing tests may only assert global invalidation. -> Mitigation: update API hook tests to cover create mutation variables with `knowledgeBaseId` and scoped invalidation.
- [Trade-off] Create mutation variables become slightly wider. -> Mitigation: keep the API payload unchanged and limit the extra field to hook-level cache behavior.
