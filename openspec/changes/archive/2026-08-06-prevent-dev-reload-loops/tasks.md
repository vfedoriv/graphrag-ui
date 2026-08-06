## 1. Development Watcher Boundary

- [x] 1.1 Add explicit Vite `server.watch.ignored` patterns for `.codebase-memory`, `.playwright-cli`, `.playwright-mcp`, and `output/playwright`, including all descendant and temporary files.
- [x] 1.2 Document beside the configuration that these paths contain generated tooling artifacts and that exclusions must remain narrow enough to preserve application HMR.

## 2. Regression Coverage

- [x] 2.1 Add a focused configuration test that verifies every required tooling directory is ignored by the resolved development watcher configuration.
- [x] 2.2 Verify in the same coverage that representative `src`, HTML, and Vite configuration paths are not matched by an overly broad custom exclusion.

## 3. Validation

- [x] 3.1 Run the focused tests, lint, the complete one-shot test suite, and the production build.
- [x] 3.2 Restart Vite and confirm repeated `.codebase-memory` persistence and browser-artifact writes no longer produce CSS invalidation, HMR updates, or document reloads.
- [x] 3.3 Confirm a representative application source edit still produces normal HMR after the watcher exclusions are active.
