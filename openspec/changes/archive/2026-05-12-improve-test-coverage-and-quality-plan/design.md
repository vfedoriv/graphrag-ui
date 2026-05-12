## Context

Current tests cover app shell smoke checks, a portion of knowledge-base behavior, some controller tab rendering, and limited API client/query key behavior. Key gaps remain in API modules (`documents`, `queries`, `schemas`, `knowledgeBases` mutation/query behavior), interaction-heavy feature workflows, and measurable coverage visibility because `@vitest/coverage-v8` is missing.

## Goals / Non-Goals

**Goals:**
- Enable coverage tooling and baseline reporting in local/CI workflows.
- Define a prioritized, risk-based test plan for missing high-value areas.
- Add deterministic test patterns for network mocking and async assertions.
- Establish a pragmatic coverage quality bar that can ratchet over time.

**Non-Goals:**
- Achieving 100% coverage.
- Migrating to a different test framework.
- End-to-end browser automation in this change.

## Decisions

1. Enable `vitest --coverage` via `@vitest/coverage-v8` and report text + html summaries.
Rationale: quick, native integration with current Vitest stack.
Alternative considered: Istanbul nyc wrapper; rejected as unnecessary complexity.

2. Use risk-first prioritization: API modules and mutation/query cache invalidation tests first, then feature workflow interaction tests.
Rationale: these areas have higher regression blast radius than purely presentational code.
Alternative considered: broad shallow coverage pass; rejected due to low signal-per-effort.

3. Standardize test harness helpers for fetch stubs and provider wrappers.
Rationale: reduce duplication and flaky setup patterns.
Alternative considered: ad-hoc per-test setup; rejected due to maintenance overhead.

4. Introduce initial coverage gates as soft thresholds documented in spec/tasks, with follow-up ratcheting.
Rationale: avoids blocking progress while still enforcing measurable improvement.
Alternative considered: strict immediate thresholds; rejected due to likely initial friction.

## Risks / Trade-offs

- [Risk] Coverage metrics can incentivize low-value tests. -> Mitigation: prioritize behavior-focused assertions over line-count-only goals.
- [Risk] Additional tests increase suite runtime. -> Mitigation: target high-risk modules and keep fixtures minimal.
- [Risk] Async/network mocks may become brittle. -> Mitigation: centralize stable mock helpers and avoid overcoupling to implementation details.

## Migration Plan

1. Add missing coverage dependency/config and confirm `npm run coverage` works.
2. Create baseline coverage snapshot and gap matrix.
3. Implement prioritized missing tests (API first, then feature workflows).
4. Add quality guardrails and documentation for test patterns/expectations.
5. Re-run lint/tests/coverage and adjust thresholds/plan.

## Open Questions

- What initial minimum coverage thresholds should be enforced in CI for statements/branches/functions?
- Should feature workflow tests remain RTL+mocked API only or introduce service-level contract fixtures in follow-up?
