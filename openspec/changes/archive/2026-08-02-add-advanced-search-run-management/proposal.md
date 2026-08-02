## Why

The backend replaced one-shot hybrid retrieval with readiness-aware, durable advanced-search runs, but the frontend has no way to submit, monitor, cancel, revisit, or deep-link those runs. A dedicated run-management workspace is needed before rich cited results can be presented safely.

## What Changes

- Add a lazy `/advanced-search` route and navigation destination between Chunking and Queries.
- Evaluate readiness for the selected knowledge base before submission, separating blockers from degraded but permitted `SCHEMA_UNAVAILABLE` and `EMPTY_CORPUS` conditions.
- Make the question and submit action primary, with collapsed per-run `maximumEvidence` and `includeEvidenceText` controls; evidence text defaults on and blank maximum is omitted.
- Support concurrent durable runs, focus the newest submission, poll only the focused non-terminal run every 1.5 seconds, and expose idempotent cancellation.
- Show focused run query/options, lifecycle stage, branch progress, evidence count, deadlines/timestamps, cancellation state, and terminal/failure outcomes.
- Add newest-first, status-filtered, server-paged history and reload-safe `/advanced-search?runId=...` selection using retained full detail when available.
- Preserve the current draft and history across queue-full, readiness conflict, pre-result conflict, expired/not-owned, interrupted, cancellation-race, and branch-failure states.
- Clear invalid cross-knowledge-base `runId` values with an explanatory notice and refetch scoped readiness/history.

## Capabilities

### New Capabilities

- `advanced-search-run-management`: Readiness-aware submission, concurrent durable lifecycle monitoring, cancellation, history, and deep-linked run recovery.

### Modified Capabilities

- `admin-app-shell-and-navigation`: Add Advanced Search after Chunking and before Queries while preserving global knowledge-base selection.

## Impact

This change adds the Advanced Search route/page, readiness and run-state orchestration, URL state, history/polling UI, and workflow tests. It depends on `align-frontend-advanced-operations-contracts` and the navigation order established by `add-chunking-strategy-management`; `add-cited-search-result-experience` builds the terminal result presentation on top of it.
