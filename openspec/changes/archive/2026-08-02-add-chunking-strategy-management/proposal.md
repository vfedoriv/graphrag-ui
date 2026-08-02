## Why

Operators can edit individual chunk settings in generic Settings, but they cannot see the backend's authoritative combined strategy, effective revision, component revisions, or migration lifecycle. A dedicated global strategy view makes configuration changes understandable and safely separates them from knowledge-base reprocessing.

## What Changes

- Add a lazy `/chunking` route with a URL-addressable Strategy view and a primary-navigation entry after Documents.
- Present curated canonical chunk controls in a fixed operational order while using runtime-setting definitions for editability, enum choices, constraints, and mutation payloads.
- Use `GET /api/v1/chunking-state` as the authoritative effective read model for values, sources, component revisions, tokenizer/parser/representation metadata, settings hash, effective chunker revision, and migration lifecycle.
- Hide compatibility aliases from editable controls while explaining reported alias precedence in a collapsed compatibility section when relevant.
- Apply changed settings atomically through the bulk runtime-settings endpoint and refetch both runtime settings and aggregate chunking state.
- Explain that saving global strategy does not reprocess existing documents and provide an explicit handoff to migration preview without starting work.

## Capabilities

### New Capabilities

- `chunking-strategy-management`: Authoritative global chunk-strategy inspection and curated atomic configuration in the Chunking workspace.

### Modified Capabilities

- `admin-app-shell-and-navigation`: Add the Chunking destination and lazy route while preserving global knowledge-base context.
- `runtime-properties-management`: Combine runtime-setting mutation metadata with the chunking-state effective read model and clarify that updates do not trigger migration.

## Impact

This change adds the initial Chunking page/route, strategy components, settings adapters, styles, and workflow tests. It depends on `align-frontend-advanced-operations-contracts`; later changes add the explorer and migration views to the same workspace.
