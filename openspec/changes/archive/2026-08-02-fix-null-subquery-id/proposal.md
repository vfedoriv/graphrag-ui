## Why

Advanced Search result payloads from the backend use `null` for `subqueryId` on aggregate text-retriever attempts because one diagnostic record covers multiple subqueries. The frontend currently requires a string, rejects otherwise valid version-one results, and shows a malformed-result error instead of the available answer/evidence and diagnostics.

## What Changes

- Align the Advanced Search diagnostic attempt type and runtime validator with the backend's nullable `subqueryId` contract.
- Preserve safe rendering of branch-level diagnostics when `subqueryId` is absent.
- Add regression coverage using backend-shaped results with `subqueryId: null` and retain validation for malformed attempt fields.
- Keep the backend API unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cited-search-result-presentation`: Valid version-one result payloads with nullable branch-level diagnostic identifiers must render as typed results instead of being classified as malformed.

## Impact

- Affected frontend API schema and types in `src/api/advancedSearch.ts` and `src/api/types.ts`.
- Affected Advanced Search result diagnostics rendering and related tests.
- No backend, dependency, or runtime configuration changes.
