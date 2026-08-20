## Why

The frontend repository already contains detailed Advanced Search and Chunking guides, but its README does not expose them and its workflow inventory no longer reflects the implemented application. The new backend-owned documentation portal needs a coordinated frontend change so readers can move between canonical system behavior and UI-specific controls, screenshots, caveats, and source maps without relying on machine-local paths.

## What Changes

- Update the frontend README to describe the current routed workflows and link to both the canonical backend portal and frontend deep dives.
- Retain the complete Advanced Search and Chunking documents while adding explicit ownership notices, canonical backend links, reciprocal navigation, and refreshed verification/source-map references.
- Replace public-facing machine-local repository pointers with stable GitHub links while preserving useful relative links inside this repository.
- Update `AGENTS.md` and `CLAUDE.md` where workflow inventories or documentation-maintenance guidance overlap.
- Verify that every new local documentation link and image target resolves and that the required backend links match the coordinated backend proposal.

## Capabilities

### New Capabilities

- `cross-repository-documentation`: Define how the frontend repository presents its implemented workflow inventory, retains UI-focused deep dives, and links readers to the canonical backend documentation portal.

### Modified Capabilities

None.

## Impact

- Affected files: frontend `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/advanced-search/*`, and `docs/chunking/*`.
- Coordinated change: `graphrag/openspec/changes/add-multipage-documentation-portal`.
- Runtime UI behavior, API clients, routes, tests, dependencies, and deployment configuration are unchanged.
