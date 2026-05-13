## Why

When users trigger backend requests, the UI currently provides little or no explicit waiting feedback in many workflows. This makes the app feel unresponsive and can cause repeated clicks or uncertainty about whether an operation is still running.

## What Changes

- Add explicit in-progress request feedback for endpoint-triggering actions.
- Ensure action buttons clearly show pending state (disabled/loading visual) while their request is in flight.
- Add a consistent UI indicator pattern (for example spinner/progress banner/overlay) to communicate ongoing backend work.
- Apply this behavior across core controller workflows so pending-state feedback is predictable.
- Add regression tests for pending-state visibility and interaction lock during in-flight operations.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `interactive-button-state-feedback`: require visible loading/pending button state during async endpoint actions.
- `controller-page-tabbed-endpoint-workflows`: require workflow-level pending indicators when endpoint calls are in progress.
- `admin-app-shell-and-navigation`: require shell/controller context to communicate active backend processing state consistently.

## Impact

- Affected code: shared UI primitives (button/loading indicator), controller pages and endpoint action handlers.
- No backend API changes.
- Improves user trust, prevents duplicate clicks, and clarifies request lifecycle.
