## Why

The Candidates review queue becomes difficult to scan as analysis produces larger, mixed sets of schema elements and review states. Reviewers need a quick way to narrow the queue to the candidates relevant to their current task without changing the backend candidate contract.

## What Changes

- Add a filter toolbar above the Candidates review queue.
- Allow candidates to be narrowed by a case-insensitive text query, candidate kind, analyzer recommendation, persistent review state, and origin.
- Combine active criteria conjunctively while allowing each individual criterion to return all values.
- Apply filters to the complete candidate set before UI pagination while preserving the existing deterministic candidate order.
- Reset pagination when filter criteria change, show filtered result totals, provide a clear-all action, and render a dedicated no-matches state.
- Keep filter state local to the Candidates workbench section; no backend API or DTO changes are introduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Extend candidate review with client-side filtering, filtered pagination semantics, filter reset behavior, and accessible empty-state feedback.

## Impact

- Affects the Schema Drafts workbench Candidates section, candidate filtering/presentation utilities, related styles, and React Testing Library coverage.
- Reuses the existing complete candidate query result and shared form primitives.
- Does not change `/api/v1` requests, response contracts, query keys, backend behavior, or add dependencies.
