## Context

The Schemas page table currently renders a uniform "Activate" action for each schema row. Backend data already carries schema status (`ACTIVE` / `INACTIVE`), but row action presentation does not consume that status to drive label or disabled behavior.

## Goals / Non-Goals

**Goals:**
- Make schema row activation controls reflect backend-reported schema status.
- Prevent activation attempts for rows already marked active.
- Keep current activation workflow for inactive rows unchanged.

**Non-Goals:**
- Changing schema activation API contracts or backend status semantics.
- Redesigning the schema table layout beyond action text/state.

## Decisions

- Use each row's status field as the source of truth for action rendering.
  - Rationale: this is already available in the list payload and avoids extra requests.
  - Alternative considered: derive active row from separate active-schema endpoint. Rejected because it adds coupling and potential race conditions without clear value.
- Render a non-actionable active-state control for active rows (caption such as "Active") and disable click handling.
  - Rationale: communicates final state and avoids redundant mutation calls.
  - Alternative considered: hide action entirely for active rows. Rejected because the column remains semantically clearer with an explicit state indicator.
- Keep existing mutation and invalidation logic for inactive rows.
  - Rationale: minimizes regression risk and scopes the fix to state-aware rendering.

## Risks / Trade-offs

- [Risk] Backend may return unexpected status values in future. → Mitigation: treat only `ACTIVE` as non-actionable and preserve current action fallback otherwise.
- [Trade-off] Disabled control still occupies action-space in active rows. → Mitigation: improves consistency across rows and keeps state visible.
