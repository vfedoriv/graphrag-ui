## 1. Upload Control Refactor Foundation

- [x] 1.1 Introduce a reusable button-triggered file-input interaction pattern (hidden file input + explicit button trigger).
- [x] 1.2 Ensure selected file state/feedback is displayed after file selection for each file-based workflow.

## 2. Documents Upload UX Update

- [x] 2.1 Replace label-click file picker on Documents page with explicit upload/select file button.
- [x] 2.2 Preserve existing multipart upload behavior and error handling after file selection.

## 3. Schemas File-Based Generation UX Update

- [x] 3.1 Replace label-click file picker in “Generate schema example from file” with explicit file-select button.
- [x] 3.2 Replace label-click file picker in “Generate schema YAML from file” with explicit file-select button.
- [x] 3.3 Preserve existing file-content loading and generation actions in both file-based tabs.

## 4. Validation and Regression Coverage

- [x] 4.1 Add or update UI tests to verify file-select buttons are rendered and file-selection flow remains actionable.
- [x] 4.2 Run lint/build/tests and fix regressions.
