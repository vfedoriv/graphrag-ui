## 1. Test Configuration

- [x] 1.1 Update `playwright.config.ts` to set `testDir`, `baseURL`, local Vite `webServer`, trace behavior, and deterministic reporter settings appropriate for local and CI runs.
- [x] 1.2 Add npm scripts for headless Playwright execution and interactive/debug execution.
- [x] 1.3 Remove or replace the external Playwright starter example tests that navigate to third-party sites.

## 2. Test Support

- [x] 2.1 Add shared Playwright helpers for mocking `/api/v1` requests, including a failure path for unhandled API calls.
- [x] 2.2 Add realistic minimal fixtures for knowledge bases, schemas, documents, chunks, query generation, validation, execution, and settings/proxy responses.
- [x] 2.3 Add targeted accessible labels or stable test IDs only where existing selectors are insufficient for reliable browser automation.

## 3. Browser Workflow Coverage

- [x] 3.1 Add app-shell navigation tests covering dashboard, knowledge bases, schemas, documents, queries, and settings routes.
- [x] 3.2 Add global knowledge-base selection coverage proving controller workflows use the selected knowledge-base context.
- [x] 3.3 Add knowledge-base workflow coverage for listing, creating, selecting, and visible error handling with mocked API responses.
- [x] 3.4 Add schema workflow coverage for validation, creation or activation, and visible output/error behavior.
- [x] 3.5 Add document workflow coverage for upload or list/process behavior plus chunk viewing with mocked responses.
- [x] 3.6 Add query workflow coverage for ask, generate, validate, and execute behaviors with visible result assertions.

## 4. Validation And Fixes

- [x] 4.1 Run the Playwright suite and fix any configuration, selector, mock, or UI issues that prevent reliable execution.
- [x] 4.2 Run existing validation relevant to the changes, including lint and the Vitest one-shot suite.
- [x] 4.3 Document the final Playwright command and any known local prerequisites in the change summary or project documentation if needed.
