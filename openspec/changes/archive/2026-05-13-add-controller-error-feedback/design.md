## Context

Code review identified silent failure paths across controller pages, primarily in mutation handlers and query rendering branches. The implementation direction is to standardize visible alert-based error rendering and prevent unhandled async rejections for `mutateAsync` call sites.

## Goals / Non-Goals

**Goals:**
- Ensure mutation and query failures in critical controller flows are always visible in-page.
- Prevent unhandled promise rejections in async UI handlers that already expose mutation error state.
- Add focused tests that lock in the new error behavior.

**Non-Goals:**
- Redesign of page layouts or tab architecture.
- Backend API contract or payload shape changes.
- Broad retry/backoff strategy changes.

## Decisions

- Decision: Use existing shared `<Alert>` primitive for all newly surfaced errors.
  Rationale: keeps visual/error language consistent and minimizes implementation risk.
  Alternative: custom per-page error banners. Rejected due to UI inconsistency and duplication.

- Decision: Keep mutation triggering patterns but add rendering guards and `try/catch` around `mutateAsync` where needed.
  Rationale: minimal change to existing control flow while removing unhandled rejection noise.
  Alternative: refactor all async handlers to callback-based mutation options. Rejected as out of scope.

- Decision: Add page-level tests that mock API failures through shared fetch helpers.
  Rationale: verifies user-visible behavior at integration boundary and matches existing project test style.
  Alternative: isolated component unit tests with mutation hook mocks. Rejected due to weaker workflow confidence.

## Risks / Trade-offs

- [Risk] Additional alerts can increase visual noise when multiple failures occur. → Mitigation: keep alerts scoped to the relevant workflow section and preserve existing layout hierarchy.
- [Risk] Test selectors can be brittle around duplicated tab labels/buttons. → Mitigation: use scoped selectors via panel test IDs for tabbed interactions.

## Migration Plan

1. Implement missing error alert rendering in affected pages.
2. Add safe async handling for `mutateAsync` call sites with existing mutation error UIs.
3. Add/update tests for each affected controller workflow.
4. Validate via targeted tests and build.

Rollback: revert page-level alert additions and associated tests if regression discovered.

## Open Questions

- None.
