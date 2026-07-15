## Why

The current Schemas page generates from one text or file and keeps editable output only in browser state, so it cannot use the backend's new durable, evidence-backed, multi-source draft lifecycle. Administrators need a knowledge-base-scoped workbench where they can add representative sources over time, run resumable analysis, review evidence and conflicts, and inspect the effective schema without changing the registered or active schema.

## What Changes

- Add a lazy-loaded Schema Drafts route and primary-navigation entry scoped to the selected knowledge base.
- Add draft list, create, inspect, update, and delete workflows with target name/version, optional base schema, structured guidance, lifecycle status, revision metadata, and published read-only handling.
- Add multi-source management for existing knowledge-base documents, pasted text, and draft-owned file uploads, including stale, unavailable, inactive, refresh, remove, and restore states.
- Add durable analysis start, status polling, per-source outcomes, partial/failed result handling, and retry controls.
- Add paged candidate review with evidence, origin, support, confidence, and review state; append-only accept, reject, modify, and pin decisions; explicit conflict resolution; effective projection; and compatibility diff views.
- Keep the existing stateless single-source generation workflows on the Schemas page. The new workbench uses persistent drafts as the primary multi-source UX rather than adding a second stateless discovery UI.
- Preserve unsent user input and surface optimistic-concurrency conflicts when the backend rejects a stale draft revision.

## Capabilities

### New Capabilities

- `schema-draft-management-ui`: Knowledge-base-scoped draft listing, lifecycle mutations, structured guidance, revision handling, and read-only published state.
- `schema-draft-source-analysis-ui`: Document, text, and file source management plus durable analysis progress, outcomes, polling, and retry.
- `schema-draft-review-ui`: Candidate evidence review, decisions, conflict resolution, effective projection, and compatibility diffs.

### Modified Capabilities

- `admin-app-shell-and-navigation`: Add a lazy-loaded Schema Drafts destination to primary navigation while preserving global knowledge-base selection.

## Impact

- Adds schema-draft DTOs, API operations, stable query keys, TanStack Query hooks, route modules, feature components, and workflow tests.
- Reuses the existing schema list for optional base-schema selection, document list for document-source selection, shared structured JSON editors for object-valued guidance and candidate modifications, and shared progress/error primitives.
- Requires backend-readable guidance content to reopen an existing draft for editing; the current `DraftResponse` exposes only guidance revision and fingerprint.
- Reliable recovery of an in-progress analysis after page reload requires a backend current/list-runs operation. Until that contract exists, a frontend can recover only run IDs retained in browser storage and must clearly label that limitation.
- Precise candidate typing depends on the backend documenting the persistent candidate page as the existing discovery `Candidate` contract rather than returning an untyped `Object` payload.
