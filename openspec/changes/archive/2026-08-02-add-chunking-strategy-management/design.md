## Context

Chunk settings are currently editable through the generic Settings catalog, but the backend distinguishes runtime-setting mutation metadata from the authoritative aggregate `GET /api/v1/chunking-state` read model. The initial `/chunking` workspace must explain that global state clearly and leave room for later Explorer and Reprocessing views.

## Goals / Non-Goals

**Goals:**

- Provide a global, operator-oriented strategy view with curated controls and full effective-state metadata.
- Save all changed chunk settings atomically and refresh both source models.
- Establish URL-addressable Chunking navigation that later changes can extend.
- Prevent users from mistaking a configuration save for document migration.

**Non-Goals:**

- Inspect chunks or create migration plans.
- Remove chunk settings from generic Settings.
- Make knowledge-base selection determine global strategy values.

## Decisions

### Use two joined read models with distinct authority

The page indexes runtime settings by canonical key for labels, constraints, allowed values, mutability, and bulk-update construction. It takes displayed effective values, sources, revisions, hashes, tokenizer/parser/representation metadata, lifecycle, and aliases from `ChunkingState`. This avoids recomputing an aggregate revision client-side.

### Render a fixed canonical control order

The UI explicitly maps strategy, target tokens, overlap, hard character limit, parent token/character/page limits, and contextual-header token/character bounds. Unknown chunk settings remain available in generic Settings but do not automatically enter this curated operational view. This trades generic extensibility for a stable, explainable workflow.

### Stage local drafts and apply once

Changed controls remain local until Apply sends one bulk runtime-settings request containing only modified keys. On success, invalidate/refetch runtime settings and chunking state as a unit. Per-control mutations were rejected because partial acceptance could leave the strategy view internally inconsistent.

### Keep aliases explanatory and read-only

Compatibility aliases never become controls. When the aggregate reports aliases, a collapsed section shows alias key, canonical key, configured/effective values, authority, and precedence. This keeps migration context visible without prolonging deprecated configuration paths.

### Establish shared workspace URL state

`/chunking` defaults to `view=strategy`; explicit `view` query parameters are owned by the workspace shell. Unsupported values normalize to Strategy with a notice. The route renders without a selected knowledge base because strategy is global, while KB-scoped views added later can require selection.

## Risks / Trade-offs

- [Backend adds a new canonical setting] → Keep it editable in generic Settings until the curated map is intentionally updated.
- [One source refetch succeeds and the other fails] → Preserve last successful data, show source-specific error state, and do not claim the combined view is refreshed.
- [Global state is confused with selected-KB state] → Label scope prominently and reserve KB context panels for Explorer/Reprocessing views.
- [Alias details overwhelm normal users] → Collapse them and render only when the backend reports relevant aliases.

## Migration Plan

1. Apply `align-frontend-advanced-operations-contracts`.
2. Add the Chunking route, shell, Strategy view, and navigation item.
3. Add curated setting adapters, drafts, bulk apply, and dual invalidation.
4. Add unit/workflow tests, then expose migration-preview navigation as a disabled or routed handoff until the migration package lands.

## Open Questions

None. Generic Settings remains the fallback editor for non-curated keys.
