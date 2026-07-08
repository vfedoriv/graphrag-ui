## Why

The project has strong current coverage, but configured thresholds remain far below the actual baseline and TypeScript does not run in strict mode. Tightening these gates will catch regressions earlier after the guardrails and refactors are stable.

## What Changes

- Enable TypeScript `strict` checking for app and node config projects.
- Ratchet Vitest coverage thresholds closer to the current measured baseline.
- Add targeted tests where stricter types or threshold increases expose weak spots.
- Defer stricter optional checks such as `noUncheckedIndexedAccess` unless the strict-mode pass shows they are low-risk.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `test-coverage-and-quality-governance`: type-checking and coverage thresholds become stricter project quality gates.

## Impact

- Affected config: `tsconfig.app.json`, `tsconfig.node.json`, and `vitest.config.ts`.
- Affected code/tests: any files surfaced by strict nullability or coverage threshold failures.
- APIs/dependencies: no runtime dependency or backend contract changes.
