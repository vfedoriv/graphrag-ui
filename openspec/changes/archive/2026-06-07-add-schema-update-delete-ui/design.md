## Context

The Schemas page is a controller-oriented React view that lists schemas for the selected knowledge base and exposes endpoint workflows through tabs. The API layer already centralizes schema calls in `src/api/schemas.ts`, normalizes backend `ProblemDetail` failures through `apiFetch`, and uses TanStack Query keys for schema list and lookup state.

The backend added:
- `PUT /api/v1/schemas/{schemaId}` with `{ content, sourceType? }`, returning updated schema details including `content`.
- `DELETE /api/v1/schemas/{schemaId}`, returning `204 No Content`.
- `409 ProblemDetail` for active-schema mutations and schema identity conflicts.

## Goals / Non-Goals

**Goals:**
- Let users start update and delete actions from the Schemas list.
- Load schema content before editing and reuse the existing structured JSON editor.
- Let users save replacement content or cancel without mutating the backend.
- Confirm deletion before calling the backend.
- Keep list, active knowledge base, and schema lookup data fresh after successful mutations.
- Cover API and workflow behavior with focused tests.

**Non-Goals:**
- Changing backend routes, request fields, or validation rules.
- Allowing updates that change schema `name` or `version`.
- Client-side reimplementation of backend active-schema or identity conflict checks.
- Adding auth, permission controls, or bulk schema actions.

## Decisions

1. Add update/delete to the existing schema API module.

   `schemasApi.update(id, payload)` will call `PUT /schemas/{id}` with `UpdateSchemaRequest`. `schemasApi.delete(id)` will call `DELETE /schemas/{id}` and expect no response body. Mutation hooks will live beside existing schema hooks and invalidate `queryKeys.schemas()`, selected knowledge-base schema lists when the caller provides a knowledge base id, and affected schema lookup/detail keys.

   Alternative considered: call `apiFetch` directly from `SchemasPage`. Keeping requests in `src/api/schemas.ts` preserves the existing typed API boundary and keeps tests close to endpoint behavior.

2. Use row actions as entry points, with an inline edit workflow in the controller area.

   The schema table will add actions for `Update` and `Delete`. Update will fetch current schema details by id, populate an editable `SchemaJsonEditor`, and expose `Save` and `Cancel`. Save sends replacement `content` and retains the schema `sourceType` when it is one of the supported values; otherwise it sends only `content` and lets the backend preserve/default source handling.

   Alternative considered: create a separate route or modal editor. The app currently presents controller endpoint workflows on one page, so an inline workflow keeps navigation and state consistent.

3. Use a confirmation dialog for deletion and keep backend conflicts authoritative.

   Delete requires explicit confirmation showing the schema identity. The UI may disable obvious active-row delete/update actions when `status === 'ACTIVE'`, but it will still surface backend `409 ProblemDetail` responses because active references can change outside the current list.

   Alternative considered: hide mutation actions for active rows entirely. Showing disabled or guarded actions with backend errors is clearer for operators and avoids implying the frontend is the source of truth.

4. Preserve local drafts on failed update.

   If update fails, the editor remains open with the attempted content and renders an error alert. Cancel discards local editor state and does not reset shared create/validate draft state.

   Alternative considered: reuse the existing shared `schemaJson` state. Isolating the update draft avoids accidental cross-tab overwrite of create/validate/generate drafts.

## Risks / Trade-offs

- Backend conflict rules are contextual and can change between list load and mutation -> keep server response visible and refresh relevant queries after success.
- Schema list rows may not include `content` -> always fetch schema details before editing.
- Unsupported `sourceType` values can appear in older data -> preserve visible unsupported-source-type warning and avoid sending unsupported values back from update payloads.
- Additional table actions can crowd the controller list -> keep action labels concise and align with existing button styling.
