## 1. Route Splitting

- [x] 1.1 Replace eager route page imports in the router with route-level lazy imports.
- [x] 1.2 Add a shared suspense/loading fallback around routed page content while keeping the app shell eager.
- [x] 1.3 Confirm all existing route paths and navigation labels remain unchanged.

## 2. Test Updates

- [x] 2.1 Update or add app/router tests for lazy route rendering.
- [x] 2.2 Ensure Playwright navigation tests wait on current page content after lazy route transitions.

## 3. Verification

- [x] 3.1 Run `npm run build` and confirm the oversized initial chunk warning is resolved.
- [x] 3.2 Run `npm run lint`, `npm run test:run`, and `npm run test:e2e`.
