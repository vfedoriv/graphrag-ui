## Why

The Vite development server currently watches generated repository metadata, including the codebase-memory graph artifacts that are rewritten every few seconds. Those writes repeatedly invalidate Tailwind CSS and trigger browser reloads, making the UI blink continuously and disrupting local development.

## What Changes

- Exclude generated codebase-memory and browser-automation artifact directories from Vite's development file watcher.
- Preserve normal HMR and full-reload behavior for application source, configuration, and other development inputs.
- Add regression coverage that verifies the generated-artifact ignore configuration remains present and narrowly scoped.
- Document the ignored artifact categories so future local tooling can be integrated without reintroducing reload loops.

## Capabilities

### New Capabilities

- `development-server-stability`: Defines how the local Vite server isolates generated tooling artifacts from application reload behavior while retaining source-file HMR.

### Modified Capabilities

None.

## Impact

- Affects the Vite development-server configuration and its watcher behavior.
- Covers `.codebase-memory`, `.playwright-cli`, `.playwright-mcp`, and repository-local Playwright output artifacts.
- Does not change production builds, runtime deployment, backend API contracts, or user-facing functionality.
- Requires focused configuration regression tests and live development-server verification.
