## Why

The repository has Playwright installed and configured, but the current browser tests are still the default external Playwright examples and do not validate the GraphRAG UI. Critical controller workflows need executable browser coverage that runs against the local Vite app with deterministic API mocks.

## What Changes

- Add project-local Playwright end-to-end tests for the admin shell and high-value controller workflows.
- Configure Playwright to start or reuse the Vite dev server on the project dev port and target same-origin app routes.
- Replace external sample tests with deterministic tests that mock `/api/v1` responses in the browser context.
- Add npm scripts for running Playwright tests in CI/headless mode and optional interactive mode.
- Execute the Playwright suite during implementation and fix UI, selector, config, or mock issues discovered by the run.

## Capabilities

### New Capabilities
- `browser-e2e-test-coverage`: Defines executable browser-level coverage expectations for critical GraphRAG UI workflows.

### Modified Capabilities
- `test-coverage-and-quality-governance`: Extend the quality requirements to include deterministic Playwright browser tests as part of the validation surface.

## Impact

- Affected files: `package.json`, `playwright.config.ts`, `tests/**/*.spec.ts`, and potentially app components that need accessible selectors or stable behavior for browser automation.
- Affected commands: new or updated npm scripts for Playwright test execution.
- No backend API contract changes; tests should mock the existing `/api/v1` HTTP surface from the UI side.
- No production runtime behavior changes except possible accessibility or testability improvements needed to make flows reliably automatable.
