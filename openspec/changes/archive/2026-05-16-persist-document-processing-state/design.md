## Context

The Documents page currently tracks row-specific process pending state in a component-local `Set<string>`. This works while the route remains mounted, but React Router unmounts the page when the user navigates elsewhere. When the user returns, the set is recreated empty, so the row button returns to `Process` even if the document list returned by the backend still shows an active processing status such as `EXTRACTING_GRAPH`.

The app already uses TanStack Query for server state and document list caching. The document list is the durable source available across route transitions, while component-local state is only appropriate for immediate interaction state that does not need to survive unmount.

## Goals / Non-Goals

**Goals:**

- Keep document processing feedback visible after navigating away from and back to the Documents page.
- Derive long-running row pending state from backend document status when the status indicates active processing.
- Preserve immediate row-level pending feedback for a locally initiated process request before the backend list reflects the new status.
- Keep completed, failed, uploaded, and otherwise idle rows actionable.
- Add focused tests for route remount behavior and in-progress backend statuses.

**Non-Goals:**

- Changing backend document processing contracts or status values.
- Adding browser storage for process state.
- Adding polling, background jobs, or push notifications unless a later change requires live progress refresh.
- Changing document upload, chunk inspection, or overwrite confirmation behavior.

## Decisions

### Derive processing UI from backend status plus local mutation state

The row should be considered processing when either:

- the document id is in the locally initiated `processingDocumentIds` set, or
- the document's backend status is classified as in progress.

Rationale: local state is necessary for instant feedback during the request that starts processing, but backend status is the only state that survives navigation and reflects work that started in another tab, another session, or before route remount.

Alternative considered: lift `processingDocumentIds` to context or localStorage. Rejected because it would still be a client guess and could remain stale after backend work completes or fails.

### Add a small document status classifier

Introduce a feature-local or API-local helper for document status classification, for example:

- `isDocumentProcessingStatus(status: string)`
- `isCompletedOrSuccessfullyProcessed(status: string)` if useful to move the existing inline helper out of the component.

The in-progress classifier should match known processing statuses from current backend behavior, including `EXTRACTING_GRAPH`, and tolerate common status naming patterns such as `PROCESSING`, `IN_PROGRESS`, `PENDING`, `RUNNING`, `QUEUED`, `EXTRACTING`, and `EMBEDDING`.

Rationale: string matching scattered inside JSX is hard to test and easy to drift. A helper gives tests a stable target without adding a new abstraction layer.

Alternative considered: treat every non-completed status as processing. Rejected because statuses such as `FAILED`, `UPLOADED`, or validation-related idle states should remain actionable.

### Disable processing rows consistently

When a row is classified as processing, the Process button should render the existing pending state (`Processing...`, disabled styling, `aria-busy`) regardless of whether the state came from local mutation state or backend status.

Rationale: this preserves the existing user-facing language and avoids adding a second visual state for the same backend activity.

Alternative considered: show a separate status-only disabled label. Rejected because the current pending button already communicates the action is unavailable while work is active.

## Risks / Trade-offs

- Unknown backend status vocabulary -> Mitigation: classify the known `EXTRACTING_GRAPH` status and include conservative common in-progress tokens while leaving failed/completed/uploaded statuses idle.
- Backend status may lag after process request starts -> Mitigation: keep local mutation state for immediate feedback until the process request settles and the documents query invalidates/refetches.
- Backend status may stay in progress after a failed request path -> Mitigation: backend status remains authoritative after navigation; process mutation errors still render inline when the current page initiated the failing request.

## Migration Plan

1. Add document status classification helper and unit coverage for in-progress, completed, failed, and idle statuses.
2. Update Documents page row pending computation to combine local `processingDocumentIds` with backend in-progress status.
3. Update existing document workflow tests and add a remount/navigation regression test for a document returned as `EXTRACTING_GRAPH`.
4. Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.

## Open Questions

- Should the Documents page start periodic refetching while any document is in an in-progress status? This proposal does not require polling, but it may be a useful follow-up if users need live completion updates without manual navigation or focus refetch.
