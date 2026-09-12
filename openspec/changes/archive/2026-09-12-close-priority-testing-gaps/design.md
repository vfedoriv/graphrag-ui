## Context

See `proposal.md` for motivation. The existing Vitest suite contains 285 unit/integration tests and the Playwright suite contains 13 browser tests. The latest representative production-source snapshot reports 83.89% statements, 76.41% branches, 83.74% functions, and 86.52% lines against gates of 80%, 70%, 78%, and 82% respectively.

Aggregate coverage masks concentrated weaknesses in document source/opening behavior, document processing action branches, Advanced Search run lifecycle state, and selected schema-builder and candidate-review interactions. Browser mocks already expose unhandled `/api/v1` requests, so mock alignment and selector style remain guardrails rather than open gap items.

## Goals / Non-Goals

**Goals:**

- Turn the gap report into a dated, measurable backlog whose entries can be closed.
- Test externally observable behavior at the narrowest practical level.
- Cover high-risk branches before deciding whether to raise global thresholds.
- Keep the complete unit, browser, coverage, lint, build, and OpenSpec validation surface green.

**Non-Goals:**

- Achieving 100% coverage or equal per-file coverage.
- Testing passive rendering branches solely to improve percentages.
- Changing production behavior, backend contracts, dependencies, or test frameworks.
- Expanding Playwright coverage when deterministic Vitest integration tests provide equivalent confidence more cheaply.

## Decisions

### Use one risk-ordered gap-closure change

Keep documentation and tests in one change so every report item has executable closure evidence and the final measurements describe the same source state. Splitting by feature was considered, but it would leave the cross-cutting baseline update dependent on several separately coordinated changes.

### Prioritize observable failure and state-transition branches

Implement tests in this order:

1. Document source/open behavior and processing actions, including malformed error responses, unavailable local opening, blocked browser opening, overwrite confirmation, and mutation failure cleanup.
2. Advanced Search knowledge-base switching, stale/mismatched/expired run selection, maximum-evidence validation, and submission/cancellation failures.
3. Candidate modify/pin validation and read-only behavior.
4. Selected Schema Builder add/remove/connect/reconnect, selection, and API failure transitions.

This order follows user-impact and state complexity rather than lowest coverage percentage. Broad snapshots and tests of implementation-private state were considered and rejected because they would be brittle and weak evidence of behavior.

### Prefer focused integration tests and retain representative browser tests

Use React Testing Library around existing feature entry points for controller state and user feedback. Use direct unit tests for pure helpers such as document target selection and error formatting. Extend Playwright only when a gap depends on real browser navigation, popup behavior, canvas interaction, or cross-page state that jsdom cannot represent credibly.

### Ratchet thresholds from the final measured baseline, not the old snapshot

Run coverage after targeted tests are complete. Raise each threshold only if the resulting value preserves an explicit safety margin; otherwise retain that threshold and document why. This avoids selecting threshold numbers before knowing the new stable baseline.

### Make the report a maintained decision record

The report will contain the measurement date, exact metrics and configured gates, remaining headroom, prioritized open gaps, and closure evidence. Ongoing principles such as stable selectors belong in contributor guidance or specs, not in the open-gap list unless a concrete violation exists.

## Risks / Trade-offs

- Test doubles may reproduce implementation details instead of behavior -> exercise public controls, visible feedback, requests, and cache invalidation outcomes.
- Large controller fixtures may make tests hard to understand -> extend existing shared render and API-mocking helpers before duplicating setup.
- Threshold ratcheting may make harmless refactors noisy -> preserve a documented margin and allow a justified same-change adjustment.
- Browser-only behavior may be missed by jsdom -> retain existing Playwright workflows and add browser coverage only for gaps that require browser semantics.
- The report can become stale again -> include a measurement date and explicit refresh triggers in the governing requirement.

## Migration Plan

1. Add focused tests in priority order while keeping production behavior unchanged.
2. Run the complete validation surface and capture the final coverage summary.
3. Update the gap report, closing completed items and retaining only evidenced residual risks.
4. Adjust coverage thresholds only where the final baseline supports the documented margin.

Rollback consists of reverting the test, report, and any threshold changes together; no runtime data or API migration is involved.
