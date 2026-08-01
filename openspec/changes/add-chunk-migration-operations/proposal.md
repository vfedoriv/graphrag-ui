## Why

Changing the global chunk strategy does not update existing knowledge-base content, while the current schema-oriented reprocessing UI cannot preview migration readiness or represent strategy-specific scope and target safety. Operators need an explicit, preview-first migration workflow with auditable history and closed-mode retries.

## What Changes

- Add a URL-addressable Reprocessing view under `/chunking?view=migrations` with reload-safe `planId` selection.
- Preview every proposed `OUTDATED_STRATEGY`, `DOCUMENT_IDS`, or forced `ALL` scope before enabling plan creation, including processing options and selected-document paging.
- Make outdated-only migration primary, place selected/all scopes behind advanced controls, and require an in-app confirmation dialog showing scope and target details for forced-all creation.
- Render backend readiness, stable blockers, target schema/profile/embedding identity, expected chunker revision, whole-KB classifications, selected counts, and paged document classifications.
- Submit only previewed migration targets and rerun preview after admission `409`, requiring fresh confirmation instead of inferring readiness from other APIs.
- Add server-filtered migration history, selected-plan polling, paged item inspection, target-currency and retry-lineage visibility, and clear explanations for stale/blocked outcomes.
- Retry eligible unresolved work only with `mode: RESNAPSHOT_UNRESOLVED` after an in-app confirmation dialog summarizes resnapshot behavior.
- Clear invalid cross-knowledge-base `planId` values with an explanatory notice.

## Capabilities

### New Capabilities

- `chunk-migration-management`: Preview-first chunk-strategy migrations, safe creation, filtered history, progress monitoring, and explicit unresolved-work retry.

### Modified Capabilities

- `schema-reprocessing-plans-ui`: Generalize shared plan presentation for reason, selection, target revision, new blocked status, server-side filters, and closed retry mode while retaining schema-publication behavior.

## Impact

This change adds the migration view to Chunking and refactors shared reprocessing UI/domain components used by schema drafts. It depends on `align-frontend-advanced-operations-contracts` and `add-chunking-strategy-management`.
