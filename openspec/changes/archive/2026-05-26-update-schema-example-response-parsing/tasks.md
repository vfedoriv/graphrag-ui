## 1. Response Parsing Update

- [x] 1.1 Locate schema example API response handling for text and file generation endpoints and identify current `{ example: string }` assumptions.
- [x] 1.2 Implement a shared normalization path that accepts direct string payloads as canonical generated example output.
- [x] 1.3 Add backward-compatible fallback parsing for object payloads with string `example`.
- [x] 1.4 Return/propagate a clear normalized client error for unexpected successful payload shapes.

## 2. Workflow Integration

- [x] 2.1 Wire normalized schema example output into the text-based schema example workflow state.
- [x] 2.2 Wire normalized schema example output into the file-based schema example workflow state.
- [x] 2.3 Verify both workflows still replace stale output with the latest successful response.

## 3. Validation and Regression Tests

- [x] 3.1 Add or update API/client tests to cover direct-string schema example responses.
- [x] 3.2 Add or update compatibility tests to cover wrapped `{ example: string }` responses.
- [x] 3.3 Add or update workflow/component tests to confirm both tabs render normalized output correctly.
- [x] 3.4 Run validation suite (`npm run lint`, `npm run test:run`, and targeted build/type-check as needed) and fix any regressions.
