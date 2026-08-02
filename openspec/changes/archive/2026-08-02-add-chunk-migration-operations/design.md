## Context

Chunk migration reuses generalized reprocessing plans but has different admission, scope, and safety semantics from schema publication. The backend preview is the only authoritative readiness source and creation revalidates its target. The UI must therefore treat preview as disposable evidence, not a reservation.

## Goals / Non-Goals

**Goals:**

- Require a current server preview before every migration creation.
- Make safe outdated-only scope prominent and risky forced-all scope deliberate.
- Provide filtered audit history, plan/item progress, target currency, and closed-mode retry.
- Reuse generalized reprocessing infrastructure without coupling migrations to a schema draft.

**Non-Goals:**

- Predict readiness from separate schema/profile/settings requests.
- Start migration automatically after a strategy update or preview.
- Restore the deprecated retry boolean or allow arbitrary retry modes.

## Decisions

### Treat preview inputs as the creation snapshot

Scope, document IDs, processing options, and preview paging live in one client draft. Creation is enabled only when the latest preview corresponds to the current draft, is ready, and has a target revision. Any draft edit invalidates the preview. The create payload copies selection/options and `expectedChunkerRevision` from that preview.

### Use server blocker taxonomy verbatim

Render `ACTIVE_SCHEMA_MISSING`, `AI_PROFILE_UNRESOLVABLE`, `EMBEDDING_SPACE_INCOMPATIBLE`, `INVALID_MIGRATION_TARGET`, and `ACTIVE_DESTRUCTIVE_PLAN` using backend messages and action-oriented labels. Do not recreate blocker logic from other caches, since those resources can race with admission.

### Make risk proportional to scope

`OUTDATED_STRATEGY` is the default visible action. `DOCUMENT_IDS` and `ALL` live in advanced controls. Forced `ALL` opens an in-app confirmation dialog containing selected count, whole-KB classifications, schema/profile/embedding target, expected revision, and a clear statement that current documents will also be rebuilt. The dialog confirmation is invalidated if preview data changes.

### Recover stale admission explicitly

On creation `409`, keep the scope draft, invalidate preview/history, request a fresh preview, and require a new confirmation. `409` is not automatically retried because the target or destructive-plan admission state may have changed.

### Filter migration history on the server

Always request `reason=CHUNK_STRATEGY_MIGRATION`; add optional selection/status filters and include all filters in keys. Totals and paging are displayed exactly from that response. Selected-plan polling uses detail/item paging and stops for terminal statuses.

### Use one explicit retry path

Eligible terminal plans expose Retry only when `retryable=true`. An in-app dialog explains that prior successes remain and unresolved items are resnapshotted under the current target. Confirmation sends only `{ mode: 'RESNAPSHOT_UNRESOLVED' }`.

## Risks / Trade-offs

- [Preview becomes stale immediately] → Creation revalidation plus mandatory refresh/reconfirmation on `409` preserves safety.
- [Selected document lists are large] → Page classifications from preview and never materialize all selected documents.
- [Schema-draft consumers regress during extraction] → Preserve schema-specific filters/request fields and test both reasons through shared hooks.
- [User mistakes BLOCKED_TARGET_CHANGED for a processing error] → Render it as a target safety stop distinct from failure and stale source.

## Migration Plan

1. Apply the shared contract foundation and Chunking strategy shell.
2. Add scope drafts and preview presentation.
3. Add confirmation, creation, stale-preview recovery, and cache invalidation.
4. Add filtered history, deep-linked detail, item paging, polling, and retry.
5. Regression-test schema-publication reprocessing and add migration E2E coverage.

## Open Questions

None. Preview is intentionally side-effect free and never represented as reserving work.
