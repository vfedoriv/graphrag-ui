## Context

Evaluation start returns a durable run identifier and the UI immediately polls its status resource. The backend status DTO uses nullable run-level `metrics` and `advisoryAssessment` fields until result aggregation finishes; recovery can also produce a terminal `INTERRUPTED` run without either result. Per-document outcomes independently move through `QUEUED`, `RUNNING`, and terminal states.

The frontend currently models run-level result objects as always present. Its strict Zod parser therefore rejects a valid HTTP 200 active response before TanStack Query can retain the run, which prevents both progress rendering and interval polling. The result component also combines run progress and completed-result presentation, so it cannot safely receive nullable result objects.

## Goals / Non-Goals

**Goals:**

- Represent the backend evaluation lifecycle accurately, including nullable run results and all declared outcome statuses.
- Preserve strict runtime validation for the fields and values the backend contract declares.
- Keep active run data in the query cache so polling continues to a terminal status.
- Present progress and paged outcomes independently from deterministic and advisory results.
- Cover active, completed, and interrupted response shapes with regression tests.

**Non-Goals:**

- Changing backend DTOs, endpoints, evaluation execution, or timeout behavior.
- Diagnosing or shortening long-running extraction/model calls.
- Relaxing evaluation responses to accept arbitrary fields or status strings.
- Changing evaluation eligibility, publication readiness, or retry semantics.

## Decisions

### Model result availability explicitly

`EvaluationRun.metrics` and `EvaluationRun.advisoryAssessment` will be nullable in both TypeScript and Zod validation. This mirrors the wire contract and also handles interrupted runs produced before aggregation.

An alternative is to make the backend synthesize empty results for active runs. That would blur “not computed yet” with a real empty result and would require a backend contract change, so it is rejected.

### Separate lifecycle progress from completed-result presentation

The workflow will render run status, aggregate counts, paged outcomes, and retry controls from the run itself. Deterministic metrics and advisory assessment will each render only when present. While an active run lacks results, the UI will state that evaluation is in progress; when a terminal run lacks a result, it will state that the result is unavailable rather than treating the response as malformed.

Keeping the two result sections independently conditional avoids assuming they always become available atomically and preserves the visual distinction between deterministic and advisory information.

### Validate declared lifecycle statuses

Frontend types and runtime schemas will enumerate the backend run and outcome status sets. The outcome set includes `QUEUED`, `RUNNING`, `SUCCEEDED`, `REUSED`, `FAILED`, `STALE_SOURCE`, and `INTERRUPTED`. This replaces the current mismatch where runtime validation accepts any string while TypeScript omits valid backend states.

### Test the lifecycle boundary at API and component levels

API validation tests will prove that active and interrupted responses with nullable run results are accepted while undeclared fields remain rejected. Workflow tests will prove that an active response shows progress and outcomes without an error and remains eligible for polling, and that completed results continue to render.

## Risks / Trade-offs

- [Nullable results can spread conditional handling through consumers] → Keep nullable handling at the release workflow/result-section boundary and use explicit presence checks.
- [A terminal response without results could hide an unexpected backend defect] → Render an explicit unavailable state with the terminal status; continue strict validation of every field that is present.
- [Polling behavior is timing-sensitive in component tests] → Test the query polling predicate separately where practical and use controlled fake responses/timers for workflow coverage.
- [Existing fixtures may over-represent completed runs] → Add dedicated active and interrupted fixtures rather than weakening the completed fixture.
