## Context

Advanced search is asynchronous, retained, independently cancellable, and readiness-gated. The current Queries page is mutation-oriented and cannot represent concurrent durable resources or reload-safe history. This change creates the workspace lifecycle while deferring rich typed-result rendering to a dependent package.

## Goals / Non-Goals

**Goals:**

- Make readiness and admission state understandable before submission.
- Support concurrent submissions without losing older runs.
- Poll, cancel, page, filter, deep-link, and recover run detail predictably.
- Preserve question drafts and history through operational failures.

**Non-Goals:**

- Render the full cited answer/evidence/diagnostic hierarchy.
- Expose global advanced-search tuning outside generic Settings.
- Treat missing schema or an empty corpus as blockers.

## Decisions

### Separate draft, focused run, and history state

The question/options draft is local form state. `runId` in the URL selects the focused owned resource. History is a server-paged query independent of focus. A successful create inserts/invalidates history and changes focus to the new run without cancelling or removing older runs.

### Readiness controls admission but does not erase the draft

Fetch readiness when the selected KB changes and before enabling submission. `ready=false` disables Submit and displays blockers. Informational `SCHEMA_UNAVAILABLE` and `EMPTY_CORPUS` render as degraded capabilities. On a readiness-related `409`, refetch immediately, retain all inputs, and present machine-readable blockers when available.

### Preserve backend defaults in request serialization

`includeEvidenceText` initializes to true. `maximumEvidence` initializes as an empty string and is omitted from JSON when blank, allowing the backend default. Runtime settings can provide non-authoritative default/max hints, but request validity follows documented server bounds.

### Poll only the focused non-terminal run

Run detail refetches every 1.5 seconds while focused status is non-terminal. History is invalidated when terminal state is observed but is not polled wholesale. Cancellation is idempotent, updates cached detail/summary, and tolerates terminal races.

### Reconcile deep links with explicit KB ownership

On KB change, clear `runId`, readiness, and scoped history/selection state. A detail `404` or mismatched `knowledgeBaseId` clears the invalid ID and shows a notice. The UI never searches other KBs or changes global selection automatically.

### Provide a bounded terminal handoff

For `COMPLETED` and `PARTIAL`, enable the result query/handoff required by the cited-result package. Until that package is applied, the lifecycle view may expose a compact terminal summary/raw diagnostic panel, but it must not invent a readable answer model.

## Risks / Trade-offs

- [Many concurrent runs tempt broad polling] → Poll only focus; history refreshes on lifecycle events and user action.
- [Run expires during retention] → Treat owned-detail `404` as expired/not-owned, keep history/draft, and clear focus with notice.
- [Cancellation races with completion] → Accept returned canonical state and keep result access when terminal output exists.
- [Settings hints become stale] → Label them as hints; omission always delegates to the backend default.

## Migration Plan

1. Apply the shared contracts and Chunking strategy/navigation packages.
2. Add route/navigation, readiness panel, form, and advanced options.
3. Add create/focus/poll/cancel orchestration and error handling.
4. Add paged history, status filtering, deep-link reconciliation, and terminal handoff.
5. Add workflow/E2E tests before applying cited-result presentation.

## Open Questions

None. Hybrid Search remains until the cited-result replacement is complete.
