## Context

The existing Playwright suite has five tests: app-shell navigation, knowledge base creation/error, schema validate/create/activate, document upload/process/chunks, and query ask/generate/validate/execute. This gives useful broad coverage, but it still misses browser-level checks for edge states that are easy to regress when endpoint paths, global selected knowledge base state, disabled controls, or API error rendering changes.

## Goals / Non-Goals

**Goals:**
- Add high-value Playwright tests based on observed coverage gaps.
- Prefer user-visible assertions and recorded API requests over implementation details.
- Reuse existing deterministic mocks and fixtures.
- Keep the suite fast enough for normal local validation.

**Non-Goals:**
- Replacing unit or workflow tests with Playwright coverage.
- Exhaustively testing every tab permutation in the browser.
- Adding production UI behavior or changing backend contracts.

## Decisions

- Add tests in the existing `e2e/controller-workflows.spec.ts` file.
  - Rationale: missing scenarios are controller workflow coverage, and the current helper/mock structure already fits them.
  - Alternative considered: create several feature-specific spec files. Rejected for now because the suite is small and colocating workflow cases keeps shared setup simple.
- Extend the existing API mock with small state controls instead of introducing separate test servers or fixtures per scenario.
  - Rationale: route interception is the established local pattern and keeps tests independent from a live backend.
  - Alternative considered: live backend E2E. Rejected because current project requirements keep browser tests deterministic and frontend-only.
- Prioritize three missing browser checks:
  - selected knowledge base schema list edge behavior, including empty KB list and active-row disabled action;
  - no-selected-knowledge-base action constraints for API-backed controller pages;
  - visible API error states for schema, document, and query workflows.

## Risks / Trade-offs

- [Risk] Additional browser tests can slow the suite. -> Mitigation: keep scenarios compact and reuse existing app navigation helpers.
- [Risk] Mock state complexity can obscure test intent. -> Mitigation: expose small, named mock controls for error responses and per-KB data rather than branching inline in tests.
- [Risk] Selectors around the structured JSON editor can be brittle. -> Mitigation: use accessible buttons and textboxes already exercised by the current schema E2E test.
