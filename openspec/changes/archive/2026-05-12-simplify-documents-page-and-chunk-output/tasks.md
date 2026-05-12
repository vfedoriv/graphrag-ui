## 1. Documents Page Workflow Simplification

- [x] 1.1 Remove endpoint tab UI from `DocumentsPage` and keep upload controls inline in the main page layout.
- [x] 1.2 Remove dedicated tab sections for process and chunk inspection while preserving row-level actions for document operations.
- [x] 1.3 Ensure `View chunks` action still requests and displays chunk output for the selected document.

## 2. Chunk Output Rendering Constraints

- [x] 2.1 Update chunk output rendering to use a bounded container with fixed max height and width-constrained layout behavior.
- [x] 2.2 Enable both horizontal and vertical overflow scrolling for chunk text output so long lines and large payloads do not expand the page.
- [x] 2.3 Keep chunk output text readable and consistent with existing shared output styling patterns.

## 3. Validation and Test Updates

- [x] 3.1 Update Documents workflow tests to assert tab removal and inline upload behavior.
- [x] 3.2 Add or adjust tests to verify chunk output appears from `View chunks` and is rendered in a scrollable container.
- [x] 3.3 Run `npm run test:run` for affected suites and resolve regressions caused by layout/workflow changes.
