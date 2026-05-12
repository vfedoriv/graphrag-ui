## 1. Coverage Tooling Baseline

- [x] 1.1 Add and configure Vitest coverage provider dependency (`@vitest/coverage-v8`) so `npm run coverage` works.
- [x] 1.2 Configure coverage reports (text + html + lcov as needed) and document where to find baseline results.
- [x] 1.3 Capture initial coverage baseline and summarize major under-covered modules.

## 2. API Test Gap Closure (High Risk First)

- [x] 2.1 Add tests for `src/api/schemas.ts` covering key success/error flows and mutation invalidation behavior.
- [x] 2.2 Add tests for `src/api/documents.ts` covering list/upload/process/chunks behavior, including multipart upload expectations.
- [x] 2.3 Add tests for `src/api/queries.ts` covering generate/validate/execute/ask request contracts and failure handling.
- [x] 2.4 Add or extend tests for `src/api/knowledgeBases.ts` mutation side effects and cache updates where coverage is missing.

## 3. Feature Workflow Test Gap Closure

- [x] 3.1 Add tests for Schemas endpoint-tab workflows with key user paths and error surfaces.
- [x] 3.2 Add tests for Documents upload/process/chunk-inspection workflows with deterministic mocks.
- [x] 3.3 Add tests for Queries ask/generate/validate/execute flows and conditional rendering paths.

## 4. Test Quality Guardrails and Consistency

- [x] 4.1 Introduce shared test helpers for provider wrappers and fetch mocking to reduce duplicated setup.
- [x] 4.2 Define and document initial coverage quality thresholds or ratchet strategy for CI adoption.
- [x] 4.3 Ensure tests follow deterministic async/assertion patterns and remove flaky or overly implementation-coupled assertions.

## 5. Validation and Rollout

- [x] 5.1 Run lint, full test suite, and coverage; fix regressions.
- [x] 5.2 Publish a short testing-gap report and completion checklist for maintainers.
