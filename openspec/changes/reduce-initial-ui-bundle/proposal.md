## Why

The production build currently emits a main JavaScript chunk warning because all routes, including the graph-heavy Schema Builder, are loaded eagerly from the router. This slows initial app load and makes future feature growth more likely to worsen the first bundle.

## What Changes

- Introduce route-level code splitting for controller pages and Schema Builder.
- Add a shared route loading state that preserves the existing app shell and navigation behavior.
- Keep backend contracts, routes, and user-facing workflows unchanged.
- Verify the production build no longer emits the current oversized initial chunk warning.

## Capabilities

### New Capabilities

- `frontend-performance-governance`: expectations for initial bundle size, route-level loading, and preservation of route behavior during code splitting.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/app/router.tsx`, app-shell loading UI, and route component imports.
- Affected validation: `npm run build`, app route tests, and Playwright navigation coverage.
- APIs/dependencies: no backend contract changes and no new runtime dependency expected.
