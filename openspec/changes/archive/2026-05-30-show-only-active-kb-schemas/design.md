## Context

The Schemas page currently uses the global schemas query result directly for its list section. Users can choose an active knowledge base in the app shell, but the list does not limit rows to schemas related to that selected knowledge base.

## Goals / Non-Goals

**Goals:**
- Display only schemas related to the currently selected knowledge base in the Schemas list.
- Keep list-based actions (including activation) operating on the filtered set.
- Show a clear empty state when no related schemas exist for the selected knowledge base.

**Non-Goals:**
- Changing backend contracts or introducing new schema-management endpoints.
- Changing global schema data ownership outside the Schemas page workflow.

## Decisions

- Build the Schemas list from knowledge-base-scoped data source(s) rather than the global unscoped schema list.
  - Rationale: ensures rows match active context and avoids unrelated schema visibility.
  - Alternative considered: keep global list and apply client-side heuristics to infer relation. Rejected due to unreliable association logic.
- Keep activation behavior unchanged for visible (filtered) rows.
  - Rationale: activation mutation already expects selected knowledge base and schema id, so scoping list context is sufficient.
- Render empty-state copy specific to selected knowledge base when the scoped list is empty.
  - Rationale: clarifies that the absence is contextual, not a global no-data condition.

## Risks / Trade-offs

- [Risk] Knowledge-base schema mapping may require additional request chaining depending on existing API modules. → Mitigation: implement via existing typed API modules and TanStack Query hooks, adding a dedicated KB-scoped query helper if needed.
- [Trade-off] Additional fetch for KB-scoped schema rows could increase page load latency. → Mitigation: preserve query caching and show existing pending/empty states.
