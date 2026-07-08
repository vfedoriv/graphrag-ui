## Context

The current unit-level validation baseline is green, but the project-level guardrails are not fully reliable. The OpenSpec validator reports two current specs without required `## Purpose` sections, and Playwright browser tests fail because assertions still target older header text/classes and the API mock does not cover newer Settings requests.

## Goals / Non-Goals

**Goals:**
- Make `openspec validate --all` pass.
- Make `npm run test:e2e` pass against current application behavior.
- Align current docs/specs with JSON schema workflows and existing validation commands.
- Keep all changes limited to guardrails, docs, specs, and tests.

**Non-Goals:**
- No UI redesign or product behavior changes.
- No backend API contract changes.
- No coverage threshold ratcheting; that is handled by `tighten-typescript-and-coverage-gates`.

## Decisions

- Update tests to current accessible UI behavior instead of reintroducing old markup.
  - Rationale: E2E tests should describe user-visible behavior, not preserve obsolete class names like `header p.font-semibold`.
  - Alternative: add compatibility markup only for tests; rejected because it couples production UI to stale tests.

- Extend the Playwright API mock for all requests made by covered routes.
  - Rationale: the suite should fail on genuinely unexpected API calls, but Settings now legitimately requests `/runtime-settings` and `/ai-profiles`.
  - Alternative: ignore unhandled calls; rejected because it hides contract drift.

- Repair current OpenSpec files directly during implementation.
  - Rationale: the invalid files are current specs, not proposed deltas; the guardrail cannot be green until the source of truth is valid.
  - Alternative: only add new delta specs; rejected because `openspec validate --all` would continue to fail before archive.

## Risks / Trade-offs

- E2E selector updates may miss a real regression if they become too text-specific -> prefer role, label, and `data-testid` selectors for durable user workflows.
- Updating active specs can look broader than app code changes -> keep edits constrained to formatting and stale wording unless a requirement is explicitly wrong.
- The first implementation pass may reveal additional stale browser expectations -> fix them in the same guardrails change and keep API mock failures actionable.
