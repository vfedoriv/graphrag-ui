## Why

The backend now exposes versioned advanced-search, authoritative chunking-state, scalable chunk-read, and generalized reprocessing contracts that the frontend does not model. A shared contract foundation is needed before the two workspaces can be implemented without duplicating DTOs, query keys, validation, or reprocessing logic.

## What Changes

- Extend frontend DTOs for runtime setting lifecycle fields, aggregate chunking state, complete chunk provenance, bounded chunk pages and hierarchy summaries, migration previews, generalized reprocessing plans, advanced-search readiness/runs, and typed version-1 results.
- Add reusable API operations and stable TanStack Query keys for chunking state, bounded chunk reads, migration preview/history/retry, and advanced-search readiness/run/result/cancellation.
- Extract reprocessing-plan API types and hooks from the schema-draft feature into a shared domain module while preserving schema-publication consumers.
- Update strict schema-draft response validation and fixtures for generalized plan reasons, selections, revisions, statuses, filtered history, and the closed retry mode.
- Define polling, terminal-result fetching, nullable legacy provenance, and payload-version validation at the API boundary.
- Keep this change additive: user-facing Chunking and Advanced Search workflows are delivered by dependent changes.

## Capabilities

### New Capabilities

- `advanced-operations-api-contracts`: Typed frontend contracts, API operations, query keys, validation rules, polling semantics, and shared reprocessing infrastructure for chunking and advanced search.

### Modified Capabilities

- `api-client-and-error-normalization`: Extend typed API-module behavior to versioned results, readiness conflicts, bounded pages, filtered history, and terminal polling.
- `schema-reprocessing-plans-ui`: Replace the deprecated retry boolean in shared consumers with the closed `RESNAPSHOT_UNRESOLVED` mode and accept generalized plan fields and statuses.

## Impact

This change affects `src/api/types.ts`, query keys, document/settings/query API modules, schema-draft response parsing and fixtures, and reprocessing-plan hooks. It depends on backend contracts through `c5dc2a2` and is a prerequisite for `add-chunking-strategy-management`, `add-scalable-chunk-explorer`, `add-chunk-migration-operations`, and `add-advanced-search-run-management`.
