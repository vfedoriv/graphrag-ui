## 1. Choice Layout

- [x] 1.1 Add a scoped choice-label style that uses content-sized inline alignment and resets checkbox and radio inputs from the global full-width input rule
- [x] 1.2 Apply the choice-label style to the advisory, reprocessing scope, processing-options, document-selection, and resnapshot choices in `SchemaDraftReleaseWorkflow`

## 2. Regression Coverage

- [x] 2.1 Extend `SchemaDraftReleaseWorkflow` tests to verify the advisory checkbox retains its visible accessible label, toggles normally, and uses the dedicated choice layout
- [x] 2.2 Run the focused Release workflow tests and inspect the Release section at representative responsive widths in both light and dark themes

## 3. Validation

- [x] 3.1 Run lint, the one-shot test suite, and the production build; resolve any regressions introduced by the layout change
