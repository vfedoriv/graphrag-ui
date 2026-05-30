## Why

The current Playwright suite covers app-shell navigation and one representative happy path for each main controller, but several high-risk browser behaviors remain untested. Recent schema-list regressions showed that endpoint wiring, selected knowledge base context, disabled actions, empty states, and user-facing failure states need broader browser coverage.

## What Changes

- Add Playwright coverage recommendations for missing high-value browser scenarios.
- Add tests for selected knowledge base-specific schema listing, including empty KB state and active-schema disabled action behavior.
- Add tests for no-selected-knowledge-base behavior on controller pages where actions should be disabled or contextual messages should appear.
- Add tests for visible API failure states in schema, document, and query workflows.
- Keep API mocks deterministic and fail on unhandled `/api/v1` requests.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `browser-e2e-test-coverage`: Broaden browser coverage expectations from representative happy paths to include selected-context edge cases, empty states, disabled actions, and API error states.

## Impact

- Affected tests: `e2e/**/*.spec.ts` and Playwright support mocks/fixtures.
- Affected validation command: `npm run test:e2e`.
- No production API contract or UI behavior changes are intended.
