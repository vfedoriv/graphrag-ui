## Why

A reviewed draft is not yet safe or usable as an extraction contract: users still need held-out quality evidence, explicit publication, explicit activation, and observable document reprocessing. The frontend must expose those backend stages as separate guarded actions so publication never appears to activate or migrate data implicitly.

## What Changes

- Extend the Schema Drafts workbench with held-out document selection, optional advisory assessment, durable evaluation progress, deterministic metrics, per-document outcomes, partial/failed handling, and retry.
- Add publication-readiness checks that display every blocking reason and bind publication to the exact current draft revision and projection content hash.
- Add idempotent publication of a ready draft and display the resulting inactive schema, immutable publication hash, live schema hash, and post-publication content drift.
- Keep publication, activation, and reprocessing as three distinct user-confirmed steps; reuse the existing activation endpoint and related query invalidation.
- Add reprocessing-plan creation for all eligible documents or an explicit selection, processing-option payloads, aggregate and per-document progress, active-schema blocking, stale-source handling, and retry with an explicit resnapshot choice.
- Render published drafts as read-only audit records while keeping links/actions for the normal registered-schema lifecycle.

## Capabilities

### New Capabilities

- `schema-draft-evaluation-ui`: Held-out document selection, evaluation execution, deterministic/advisory result presentation, progress recovery, and retry.
- `schema-draft-publication-ui`: Revision-specific readiness, blocking-reason remediation, guarded publication, publication audit details, and content-drift visibility.
- `schema-reprocessing-plans-ui`: Explicit post-activation plan creation, progress and outcome inspection, safety states, and retry behavior.

### Modified Capabilities

- `schema-management-and-activation`: Allow the published schema to be activated explicitly from the draft release workflow while preserving the existing Schemas-page activation behavior and cache consistency.

## Impact

- Depends on `add-schema-draft-workbench` and its schema-draft route, DTOs, revision-aware cache, and review context.
- Adds evaluation, publication, and reprocessing-plan DTOs, API operations, query keys, polling hooks, UI sections, confirmations, and tests.
- Reuses knowledge-base documents for held-out and reprocessing selection, registered schemas for activation state, document processing option shapes, and existing API error normalization.
- Reliable reload recovery and historical inspection require backend list/current operations for evaluation runs and reprocessing plans; current contracts expose only get-by-known-ID operations.
- A precise metrics UI requires documented response shapes for evaluation `metrics` and `advisoryAssessment`; otherwise those values must initially use a structured generic inspector.
- The frontend does not change backend contracts or automatically publish, activate, or reprocess.
