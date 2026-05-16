## Why

Document processing currently shows correct row-level pending feedback while the user stays on the Documents page, but that feedback disappears after navigating away and returning because the pending document id set is stored inside the page component. This makes an active backend processing job look idle even when the refreshed document row still reports an in-progress status such as `EXTRACTING_GRAPH`.

## What Changes

- Preserve user-visible processing state across navigation away from and back to the Documents page.
- Treat backend in-progress document statuses as authoritative signals for row-level processing UI.
- Keep locally initiated process mutation state for immediate feedback while the request is in flight.
- Ensure processing rows show disabled `Processing...` action state after route remount when backend status indicates active processing.
- Keep completed, failed, and idle rows actionable with the normal `Process` button.
- Add regression tests for process state across route unmount/remount and backend in-progress statuses.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-ingestion-and-processing`: Document process pending feedback must survive Documents page unmount/remount by reflecting backend in-progress status as well as locally initiated mutation state.
- `frontend-state-governance`: Long-running backend workflow indicators must not depend only on route-local component state when server data contains an authoritative in-progress status.

## Impact

- Affected source areas: `src/features/documents/DocumentsPage.tsx`, document workflow tests, and possibly a small shared helper for document status classification.
- No backend API contract changes are required.
- No new runtime dependency is expected.
- Existing validation commands remain applicable: `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
