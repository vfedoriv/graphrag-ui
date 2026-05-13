## Context

The Schemas controller uses a static `EndpointTab[]` definition in `SchemasPage.tsx` to render tab buttons and corresponding panels. Current tab ordering is functional but not aligned with the preferred user sequence for example generation, YAML generation, validation, creation, and lookup.

## Goals / Non-Goals

**Goals:**
- Reorder Schemas tabs to the requested sequence.
- Preserve all existing tab behaviors, handlers, and pending-state UX.
- Keep implementation minimal and low-risk.

**Non-Goals:**
- No backend/API changes.
- No changes to tab labels, payload shapes, or business logic.
- No redesign of shared tab components.

## Decisions

- Update only the order of entries in the `tabs` array in `SchemasPage.tsx`.
Rationale: tab rendering is order-driven, so this is the smallest possible change with clear intent.

- Keep tab IDs and tab content components unchanged.
Rationale: prevents regressions in tests/selectors and preserves existing workflows.

- Update tests only if they rely on tab positional order.
Rationale: avoid churn in unrelated assertions while preserving behavior guarantees.

## Risks / Trade-offs

- [Risk] Hidden assumptions in tests about tab default order may fail. → Mitigation: run targeted Schemas tests and adjust order-dependent assertions.
- [Risk] Future feature additions may reintroduce inconsistent ordering. → Mitigation: encode desired order explicitly in spec/tasks and keep tab list grouped by workflow sequence.
