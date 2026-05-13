## Context

Review action #4 prioritizes missing tests rather than runtime refactors. The highest-risk gaps are concentrated in shared UI file input behavior, API client edge branches used by important workflows, and key feature workflows (KB delete selection state and schema activation).

## Goals / Non-Goals

**Goals:**
- Add regression tests for FileSelectButton reset and async callback behavior.
- Add API client tests for 204/empty-body and ProblemDetail fallback branches.
- Add/extend workflow tests for KB delete auto-deselect and schema activation row action.
- Keep test style aligned with existing boundary-mocked fetch patterns.

**Non-Goals:**
- Broader coverage uplift for all remaining “important” and “suggestion” review items.
- Runtime logic changes unless tests reveal genuine defects.
- New test frameworks or tooling changes.

## Decisions

- Decision: Prefer existing `stubFetch`/`jsonResponse` helpers in feature/API tests.
  Rationale: preserves deterministic test patterns already used in repo.
  Alternative: direct global fetch mocks per test file. Rejected due to inconsistency and duplication.

- Decision: Add narrowly scoped tests per identified critical gap, not broad snapshot tests.
  Rationale: improves signal-to-noise and maps directly to review findings.
  Alternative: large integrated smoke tests. Rejected due to brittleness and weaker branch targeting.

- Decision: Validate with targeted test run plus build.
  Rationale: fast feedback while ensuring type and bundle safety.
  Alternative: only full suite. Rejected as slower for iterative gap-closure changes.

## Risks / Trade-offs

- [Risk] Workflow tests may over-couple to current button labels or tab order. → Mitigation: use stable test IDs and scoped selectors where available.
- [Risk] Additional tests can increase maintenance burden. → Mitigation: keep each test focused on one failure/success contract.

## Migration Plan

1. Add FileSelectButton tests for reset and async selection callback behavior.
2. Extend API client tests for 204, empty body, title-only, and null fallback branches.
3. Extend KB and schema workflow tests for delete/activate critical paths.
4. Run targeted test files and build.

Rollback: remove newly added tests if they prove invalid, then re-scope with clarified behavior.

## Open Questions

- None.
