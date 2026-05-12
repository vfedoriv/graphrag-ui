## Why

The current test suite verifies only a subset of critical paths and does not provide measurable coverage reporting because coverage tooling is not fully configured. We need a structured testing improvement plan now to reduce regression risk as UI workflows and API integrations grow.

## What Changes

- Establish a test coverage baseline workflow by enabling Vitest coverage reporting.
- Audit existing tests and identify high-risk untested areas in API modules and core feature workflows.
- Define and implement a prioritized testing plan for missing unit/integration tests.
- Introduce test-quality guardrails (coverage target/check, deterministic mocks, and stable test patterns).

## Capabilities

### New Capabilities
- `test-coverage-and-quality-governance`: Standardized process and requirements for coverage reporting, gap tracking, and prioritized test implementation across API and feature workflows.

### Modified Capabilities
- `api-client-and-error-normalization`: Expand normative test expectations for API client behavior and error normalization quality gates.

## Impact

- Affected areas: `package.json` test tooling scripts/dependencies, `vitest` config, API tests under `src/api`, feature tests under `src/features`, and app-level shell tests.
- No backend/API runtime behavior changes.
- CI/runtime testing reliability and regression detection quality improve.
