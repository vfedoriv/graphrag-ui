## Context

The Documents page currently binds the Process button pending state to a mutation-level `isPending` flag, which causes every Process button in the table to render as pending when one document is processing. The expected behavior is row-scoped pending feedback so only the clicked record shows processing state.

## Goals / Non-Goals

**Goals:**
- Scope Process button pending UI to the active document row only.
- Keep other rows unchanged while one document process request is running.
- Preserve existing process flow behavior (status-based confirmation and 409 fallback overwrite confirmation).
- Add regression coverage for row-specific pending rendering.

**Non-Goals:**
- Changing backend process API behavior.
- Introducing concurrent multi-row process requests.
- Redesigning table layout or button styling outside pending-state scope.

## Decisions

1. Track active process document id in Documents page state
- Decision: add local state to store `processingDocumentId` for the currently running process action.
- Rationale: this enables deterministic row-specific pending conditions independent of global mutation flags.
- Alternative considered: deriving row state only from mutation variables. Rejected due to weaker control around transitions and retries.

2. Compute per-row pending flag from mutation status + active id
- Decision: Process button `isPending` SHALL be true only when mutation is pending and row id matches `processingDocumentId`.
- Rationale: keeps loading text localized to the initiating row while preserving existing pending visuals.
- Alternative considered: remove pending indicator entirely. Rejected because action feedback remains necessary.

3. Clear row state in all completion paths
- Decision: reset `processingDocumentId` after success, failure, confirmation decline, and retry completion.
- Rationale: prevents stale pending binding on subsequent operations.
- Alternative considered: rely only on mutation lifecycle. Rejected because multi-step confirm/retry logic has additional early returns.

## Risks / Trade-offs

- Complex process flow (pre-confirm + 409 fallback + retry) may leave row id stale if not reset consistently -> Mitigation: centralize reset in `finally` branch around the async process handler.
- Future support for parallel process actions would conflict with single active id model -> Mitigation: current scope explicitly excludes parallel runs; revise to per-id map if needed later.

## Migration Plan

1. Update Documents page row action state/rendering for row-scoped process pending behavior.
2. Update workflow tests to assert only targeted row shows pending text.
3. Run lint/tests/build before merge.

Rollback: revert Documents page row-pending state changes and corresponding tests.

## Open Questions

- None.
