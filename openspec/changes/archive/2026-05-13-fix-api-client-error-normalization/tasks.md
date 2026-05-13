## 1. Error Model Hardening

- [x] 1.1 Convert `ApiError` from a plain type to a class extending `Error` while preserving existing `message` and `details` access patterns.
- [x] 1.2 Ensure `normalizeProblemDetail` continues returning stable message/details fallbacks for missing or malformed backend payloads.

## 2. API Client Normalization

- [x] 2.1 Wrap `fetch` execution in `apiFetch` to convert transport-level failures into `ApiError`.
- [x] 2.2 Wrap success-path JSON parsing to convert malformed JSON responses into `ApiError`.
- [x] 2.3 Preserve existing handling for 204/empty-body success responses and non-OK `ProblemDetail` responses.

## 3. Regression Coverage

- [x] 3.1 Add/adjust tests for transport failure normalization behavior.
- [x] 3.2 Add/adjust tests for malformed JSON success-response normalization behavior.
- [x] 3.3 Run lint/test/build checks for the touched scope.
