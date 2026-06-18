## Context

The Settings page currently describes frontend proxy/runtime behavior with read-only static values. The backend now provides runtime settings through `/api/v1/runtime-settings`, AI profile CRUD through `/api/v1/ai-profiles`, and knowledge-base AI profile assignment through `/api/v1/knowledge-bases/{knowledgeBaseId}/ai-profile`. Knowledge base responses also include `activeAiProfileId`.

Runtime settings are allowlisted backend-owned properties. Each setting carries `key`, `category`, `valueType`, `currentValue`, `defaultValue`, `source`, `mutable`, `liveApplied`, `sensitive`, `constraints`, `updateMode`, `reason`, `label`, and `description`. Only live-mutable settings can be updated or cleared through the settings API. Sensitive settings are masked and must never reveal raw secret values.

AI provider defaults are represented in runtime settings as profile-managed or startup-bound context. Active provider behavior for knowledge-base-scoped workflows is managed through AI profiles and knowledge-base profile assignment.

## Goals / Non-Goals

**Goals:**
- Add typed frontend API support for runtime settings, AI profiles, and knowledge-base AI profile assignment.
- Turn the existing Settings/Properties area into a live settings catalog with safe edit and clear workflows.
- Add AI profile management UI that handles write-only API keys and profile defaults.
- Expose active AI profile context where users run AI-backed workflows.
- Keep behavior same-origin under `/api/v1` and use TanStack Query keys/invalidation consistently.

**Non-Goals:**
- No backend API changes.
- No placeholder authentication, authorization, or secret-management features.
- No attempt to edit startup-bound, read-only, sensitive read-only, or profile-managed runtime properties through the runtime settings API.
- No automatic document reprocessing or embedding migration when profile settings change.

## Decisions

### Typed API modules

Add DTOs in `src/api/types.ts` and feature API modules for `runtimeSettings` and `aiProfiles`. Extend `knowledgeBases` with `getActiveAiProfile` and `updateActiveAiProfile`, and add `activeAiProfileId` to `KnowledgeBase`.

Alternative considered: keep all new calls inside page components. That would duplicate request details and make query invalidation harder to test.

### Runtime settings value editing

Render values according to `valueType` and constraints using conservative editors:
- boolean values use a checkbox/toggle.
- numeric values use number inputs with min/max constraints where available.
- string values use text inputs.
- collection/object values use JSON editing through existing structured JSON editor/output primitives when practical.

The edit action sends `{ value }` to `PUT /runtime-settings/{key}`. The clear action calls `DELETE /runtime-settings/{key}`. Both actions are enabled only when the setting is mutable/live according to the backend fields. Read-only rows show `reason` and `updateMode` instead of disabled forms with unclear affordances.

Alternative considered: build per-key bespoke forms. That would improve polish for a few known keys but would not scale with the expanded backend catalog.

### Settings page information architecture

Keep the Settings route as the control-plane page and split it into runtime properties and AI profiles sections, using existing controller page, workspace strip, table, status badge, alert, and output preview patterns. Add category/update-mode/search filters so the large catalog remains scannable.

Alternative considered: create separate routes. Keeping both under Settings matches the existing navigation and makes profile-managed runtime settings easy to cross-reference.

### AI profile secret handling

Profile create/update forms accept an API key value but never display it after save. Existing profiles show `apiKeyConfigured` and `apiKeyMask`; update forms omit API key by default and provide explicit replace/clear controls.

Alternative considered: show a password field pre-filled with a mask. That risks implying the mask is a reusable value and can accidentally submit masked text as a secret.

### Contextual display

Show active AI profile identity and relevant live settings summaries on pages where backend behavior depends on them:
- Knowledge Bases: active profile assignment and row/table context.
- Schemas: active profile for schema/example generation.
- Documents: active profile and chunking/extraction settings summary for processing.
- Queries: active profile and query safety settings summary for generation, validation, execution, and hybrid search.

The contextual displays are read-only summaries with links or actions back to Settings/Knowledge Bases for edits.

## Risks / Trade-offs

- Runtime setting value shape may vary by backend catalog entry -> Use generic JSON-safe rendering/editing and surface backend validation errors inline.
- Large settings catalogs may become noisy -> Provide filters, category grouping, and update-mode badges from the first implementation.
- Profile changes can make existing embeddings incompatible -> Rely on backend rejection for assignment and show errors without changing selected state.
- API key workflows can be confusing -> Separate replace/clear actions from ordinary profile field edits and never render raw or masked secrets as editable values.
- Contextual setting summaries can drift from exact backend behavior -> Keep them derived from the same runtime settings/profile queries and treat missing data as unavailable rather than inferred.

