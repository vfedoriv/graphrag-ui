## 1. Queries and Knowledge Bases Error Surfacing

- [x] 1.1 Ensure Queries page shows inline alerts for ask/generate/validate/execute failure states.
- [x] 1.2 Ensure async generate flow does not emit unhandled promise rejections and preserves existing form state on failure.
- [x] 1.3 Ensure Knowledge Bases page shows inline alerts for update and delete failures and keeps selection stable on delete failure.

## 2. Documents and Schemas Error Surfacing

- [x] 2.1 Ensure Documents page shows process failure alerts and chunk-load error alerts instead of undefined output rendering.
- [x] 2.2 Ensure Schemas page shows activation failure alerts and validation-request failure alerts in the validate tab.

## 3. Regression Test Coverage

- [x] 3.1 Add/extend controller page tests for query and knowledge-base error alerts.
- [x] 3.2 Add/extend controller page tests for document and schema error alerts.
- [x] 3.3 Run targeted test suite and build for the affected workflows.
