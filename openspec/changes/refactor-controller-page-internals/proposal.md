## Why

Several feature pages have grown into large files that mix rendering, local workflow state, mutation orchestration, parsing, and helper components. This makes changes riskier even though the current behavior and test coverage are generally strong.

## What Changes

- Extract feature-local hooks, components, and helper modules from the largest controller pages.
- Keep controller page behavior, routes, backend request shapes, query keys, and visual direction unchanged.
- Prioritize Documents, Schemas, Settings, and Schema Builder because they contain the largest files and densest local workflow state.
- Add focused regression tests around extracted workflow state and parsing helpers.

## Capabilities

### New Capabilities

- `frontend-maintainability-governance`: expectations for feature-local decomposition, behavior-preserving refactors, and regression coverage.

### Modified Capabilities

- None.

## Impact

- Affected code: feature modules under `src/features/documents`, `src/features/schemas`, `src/features/settings`, and `src/features/schema-builder`.
- Affected tests: colocated feature tests plus existing workflow and E2E tests.
- APIs/dependencies: no backend contract changes and no new state-management dependency.
