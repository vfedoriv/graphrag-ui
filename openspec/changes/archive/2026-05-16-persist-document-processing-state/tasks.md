## 1. Document Status Classification

- [x] 1.1 Add a document status helper that classifies active processing statuses, including `EXTRACTING_GRAPH`.
- [x] 1.2 Add unit tests for processing, completed, failed, uploaded, and unknown document status classification.

## 2. Documents Page Behavior

- [x] 2.1 Update Documents page row pending computation to combine local process mutation state with backend in-progress document status.
- [x] 2.2 Keep completed, failed, uploaded, and idle rows actionable with the normal `Process` button.
- [x] 2.3 Ensure the page-level progress banner appears when any displayed document has an in-progress backend status.

## 3. Regression Coverage

- [x] 3.1 Add workflow coverage for loading a document with `EXTRACTING_GRAPH` and rendering its Process button as `Processing...`.
- [x] 3.2 Add navigation/remount coverage showing that returning to Documents preserves processing feedback from backend status.
- [x] 3.3 Verify existing row-specific local pending tests still pass for locally initiated process requests.

## 4. Validation

- [x] 4.1 Run `npm run lint` and fix any lint issues introduced by the change.
- [x] 4.2 Run `npm run test:run` and fix any failing tests.
- [x] 4.3 Run `npm run coverage` and ensure coverage thresholds remain valid.
- [x] 4.4 Run `npm run build` and fix any TypeScript or production build issues.
