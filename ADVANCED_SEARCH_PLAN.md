# Versioned Chunking and Advanced Search UI

## Summary

Add two first-class workspaces:

- `/chunking`: global chunk-strategy configuration, scalable hierarchical chunk inspection, migration preview, and knowledge-base reprocessing.
- `/advanced-search`: readiness-aware durable cited search runs, polling, cancellation, history, readable answers, and evidence.

Keep document upload and parser/OCR options on Documents. Keep Ask and Cypher tools on Queries, but remove the obsolete Hybrid Search workflow because its backend endpoint was deleted.

Create an OpenSpec change named `add-chunking-and-advanced-search-ui` before implementation, covering chunking management, advanced search, navigation, and removal of the legacy hybrid-search contract.

## Backend Baseline

Implement against the backend through `c5dc2a2`, including the changes introduced after `17976d63`:

- `78db38b`: typed advanced-search results, run query/options in owned resources, source citation metadata, and readiness/admission contracts.
- `e4b4700`: authoritative chunking state, migration previews, server-side plan filters, and the closed retry mode.
- `c5dc2a2`: bounded chunk paging, metadata-only hierarchy summaries, and direct chunk lookup.

These contracts replace the frontend workarounds and limitations assumed by the earlier version of this plan.

## Contract and API Alignment

- Extend frontend DTOs for the current backend without modifying backend contracts:
  - `RuntimeSetting`: retain `activeValue`, `lifecycleState`, `effectiveChunkerRevision`, and `chunkMigrationLifecycle` for compatibility.
  - Add the aggregate `ChunkingState` contract with canonical effective values, value sources, component revisions, tokenizer/parser/representation metadata, settings hash, effective revision, migration lifecycle, and compatibility-alias precedence.
  - `DocumentChunk`: include hierarchy, source range, structural path, processing run, hash, tokenizer, and revision fields; allow nullable provenance for legacy chunks.
  - Add `DocumentChunkPage`, `DocumentChunkSummary`, and `DocumentChunkHierarchy` envelopes.
  - Generalize reprocessing types with `reason`, `selection`, `expectedChunkerRevision`, filters, preview target/classification data, retry mode, and `BLOCKED_TARGET_CHANGED`.
  - Add explicit advanced-search readiness, request, run summary/detail, page, typed version-1 result, answer, claim, evidence/context, graph-fact, limitation, and diagnostics DTOs.
- Add advanced-search API operations and stable query keys:
  - Read readiness at `GET /api/v1/knowledge-bases/{knowledgeBaseId}/queries/advanced-search-runs/readiness`.
  - Submit, list/filter/page, poll detail, fetch result, and cancel.
  - Poll focused non-terminal runs every 1.5 seconds.
  - Fetch results automatically only for `COMPLETED` or `PARTIAL` runs.
- Use `maximumEvidence` in submission payloads and default `includeEvidenceText` to `true`; omit a blank maximum so the backend applies its default.
- Model `RunSummaryResponse.queryPreview`, `maximumEvidence`, and `includeEvidenceText`, and model the full `query` on create/detail responses. History and deep-linked detail must therefore remain meaningful after reload.
- Consume the typed `AdvancedSearchResultV1` contract rather than reverse-engineering a generic JSON node. Check both envelope and result `payloadVersion`; show an explicit unsupported/malformed-result state with raw diagnostic JSON instead of attempting coercion.
- Prefer snapshotted `sourceDisplayLabel`, `sourceFilename`, and `sourceContentType` for citations. Keep them nullable for legacy version-1 results and use the current document list only as an optional legacy display fallback.
- Add chunking API operations and stable query keys:
  - Aggregate state from `GET /api/v1/chunking-state`.
  - Migration preview from `POST /api/v1/knowledge-bases/{knowledgeBaseId}/chunk-migrations/preview?page=…&size=…`.
  - Filtered reprocessing history with optional `reason`, `selection`, and `status` query parameters.
  - Retry with `{ "mode": "RESNAPSHOT_UNRESOLVED" }`; do not use the deprecated boolean compatibility field.
  - Hierarchy summaries from `GET /api/v1/documents/{documentId}/chunks/hierarchy`.
  - Filtered pages from `GET /api/v1/documents/{documentId}/chunks/page` with `kind`, `parentChunkId`, and `sectionIndex` filters.
  - Direct lookup from `GET /api/v1/documents/{documentId}/chunks/{chunkId}`.
  - Do not use the compatibility-only complete-list chunk route in the new workspace.
- Extract reprocessing-plan API/types from the schema-draft feature into a shared domain module. Preserve existing schema-publication consumers while adding the new filters, preview, and retry mode.
- Update strict schema-draft response validation and fixtures to accept the new reprocessing fields and statuses.
- Remove Hybrid Search DTOs, API calls, mutation hooks, tests, and the stale OpenSpec API-client requirement.

## Implementation Changes

### Navigation and document handoff

- Add sidebar destinations in this order: Documents, Chunking, Advanced Search, Queries.
- Register lazy routes `/chunking` and `/advanced-search`.
- Replace inline chunk inspection on Documents with an “Inspect chunking” link to `/chunking?view=chunks&documentId=…`; retain upload, replace, delete, processing, and parser/OCR-option workflows.
- Support reload-safe links:
  - `/chunking?view=chunks&documentId=…&chunkId=…`
  - `/chunking?view=migrations&planId=…`
  - `/advanced-search?runId=…`
- Clear incompatible selected IDs and cached readiness/preview state when the global knowledge-base selection changes.

### Chunking workspace

- Divide the page into URL-addressable Strategy, Chunk Explorer, and Reprocessing views.
- Clearly distinguish global strategy configuration from knowledge-base-scoped documents and migrations.
- Strategy view:
  - Use `GET /api/v1/chunking-state` as the authoritative effective read model.
  - Present curated canonical controls in a fixed order: strategy, target tokens, overlap, hard character limit, parent token/character limits, parent page limit, and contextual-header bounds.
  - Use the generic runtime-settings definitions for editability, enum values, numeric constraints, and mutation payloads; use chunking state for effective values and revision/lifecycle presentation.
  - Hide compatibility aliases as editable controls, but surface their reported precedence in a collapsed compatibility explanation when relevant.
  - Show value sources, settings hash, strategy/tokenizer/parser/representation component revisions, effective chunker revision, and migration lifecycle read-only.
  - Save changed settings atomically through the bulk runtime-settings endpoint, then invalidate/refetch both runtime settings and chunking state.
  - Explain that existing documents were not changed and offer an explicit migration-preview action without starting work automatically.
- Chunk Explorer:
  - Select from documents in the active knowledge base; never download the complete chunk list for the new UI.
  - Load a bounded metadata-only parent page from `/chunks/hierarchy` and show its `flatChunkCount`.
  - Expand a parent by paging `/chunks/page?parentChunkId=…`; fetch further child pages on demand.
  - For flat/legacy documents, page non-parent chunks through `/chunks/page`, using the returned total instead of materializing the whole document.
  - Show concise page, section, structural-path, child-count, and token summaries in the outline.
  - Fetch the selected chunk directly from `/chunks/{chunkId}` for full authoritative text and provenance, including source offsets, processing run, strategy/effective revisions, tokenizer, hashes, confidence, and raw metadata.
  - When opened with `chunkId`, perform direct lookup first. If it is a child, load/expand its parent and select it; if its hierarchy row is outside the current page, preserve the directly fetched selection while offering navigation through paged results.
  - Handle unprocessed documents, empty hierarchy and flat results, empty parent child pages, legacy null metadata, page/filter errors, and ownership-safe `404` explicitly.
- Reprocessing:
  - Preview every proposed scope through `/chunk-migrations/preview` before enabling creation. Preview is side-effect free and accepts `OUTDATED_STRATEGY`, `DOCUMENT_IDS`, or `ALL`, processing options, and selected-document paging.
  - Make `OUTDATED_STRATEGY` the primary action. Put `DOCUMENT_IDS` and forced `ALL` behind advanced scope controls; forced all requires stronger confirmation.
  - Present preview readiness, stable blocker codes, active schema/profile/embedding target, `expectedChunkerRevision`, whole-knowledge-base `noChunks`/`outdated`/`current` counts, selected count, and the paged selected-document classifications.
  - Treat `ACTIVE_SCHEMA_MISSING`, `AI_PROFILE_UNRESOLVABLE`, `EMBEDDING_SPACE_INCOMPATIBLE`, `INVALID_MIGRATION_TARGET`, and `ACTIVE_DESTRUCTIVE_PLAN` as actionable blockers using server messages.
  - Submit `reason: CHUNK_STRATEGY_MIGRATION`, the previewed selection and processing options, the preview target’s `expectedChunkerRevision`, and document IDs only for `DOCUMENT_IDS`.
  - On creation `409`, invalidate and rerun the preview, explain that readiness or the target changed, and require confirmation/resubmission. Never infer migration readiness from separate settings/profile/schema calls.
  - Request migration-only history using `reason=CHUNK_STRATEGY_MIGRATION`; optionally add server-side Selection and Status filters. Totals and paging must come from the filtered response.
  - Include Reason, Selection, Target Revision, Status, Progress, Target Currency, Retryability, Retry Lineage, and Created columns.
  - Poll the selected active plan, page its items, explain `STALE_SOURCE`, `BLOCKED`, and `BLOCKED_TARGET_CHANGED`, and retry eligible terminal unresolved work only with `mode: RESNAPSHOT_UNRESOLVED` after explicit confirmation.

### Advanced Search workspace

- Load readiness for the active knowledge base before submission and render blockers separately from degraded capabilities.
  - Disable submission when `ready=false` and show the backend blocker codes/messages.
  - Treat `SCHEMA_UNAVAILABLE` as text-only search and `EMPTY_CORPUS` as an allowed insufficient-evidence scenario, not as blockers.
  - Show profile identity/revision, graph-branch availability, and embedded-corpus presence in a compact readiness panel.
  - Refetch readiness after relevant schema, AI-profile, document-processing, or knowledge-base changes and immediately before/after a readiness-related admission conflict.
- Make the question field and submit action primary.
- Put `maximumEvidence` and `includeEvidenceText` in collapsed advanced options:
  - Evidence text starts enabled.
  - Maximum evidence starts blank so the backend default applies.
  - Display backend-derived default/max hints when runtime settings are available.
- Allow multiple concurrent runs. Focus the newest submission while older runs continue in history.
- Show focused run query, applied evidence options, stage, branch progress, evidence count, deadline/timestamps, cancellation state, and an idempotent Cancel action.
- Render terminal typed results for both `COMPLETED` and `PARTIAL`:
  - Answer status, readable answer text, confidence, and limitations.
  - Claim cards with citation chips; do not fabricate inline citation positions because the backend still does not expose answer segments or citation offsets in answer text.
  - Ranked evidence using snapshotted source display label/filename/content type, source/page ranges, structural path, revision, score, and returned excerpt.
  - Context-only entries separately from ranked evidence.
  - Graph facts and their evidence/citation references.
  - Citation links into the Chunking explorer using `documentId` and `chunkId`; direct lookup makes these links scalable.
  - Explicit presentations for insufficient evidence and answer unavailable.
- Keep planning, sufficiency, follow-up, retriever attempts, fusion, graph expansion, parent context, reranking, selection, source-metadata warnings, answer diagnostics, and raw JSON in collapsed diagnostic sections.
- Add newest-first history with status filter and paging. Label rows with `queryPreview`, status, stage, applied evidence options, and timestamps; selecting a row loads full query/detail when retained.
- Handle `429` queue-full, readiness `409` with machine-readable blockers, pre-result `409`, expired/not-owned `404`, interrupted runs, cancellation races, partial branch failures, nullable legacy citation metadata, missing evidence text, and unsupported/malformed payload versions without losing the current draft question or history.

### Existing Queries and Settings

- Remove the Hybrid Search tab and update Queries copy, status summaries, runtime-setting hints, and pending-state aggregation.
- Keep Ask, Generate Cypher, Validate Cypher, and Execute Cypher unchanged.
- Keep all advanced-search runtime tuning in generic Settings; Advanced Search only exposes per-run evidence controls.
- Keep the generic Settings page capable of editing chunking settings, while the Chunking workspace combines those mutation definitions with the authoritative aggregate state.

## Test Plan

- API and contract tests:
  - Exact readiness, run, result, cancellation, paging/filter, chunking-state, migration-preview, filtered-plan-history, retry, hierarchy, chunk-page, and direct-chunk routes.
  - `maximumEvidence` payload naming, omitted blank maximum, readiness conflict parsing, stable query keys, terminal polling, and cache invalidation.
  - Typed version-1 advanced-search result mapping, nullable legacy source metadata, unsupported versions, and malformed responses.
  - Chunk hierarchy/page/direct DTOs and migration preview/create/retry payloads for outdated, selected, and all scopes.
  - Updated schema-reprocessing validators with new fields, filters, statuses, and retry mode.
  - Confirm the new Chunk Explorer never requests the compatibility complete-list route and no request targets the removed hybrid-search endpoint.
- Chunking component/workflow tests:
  - Aggregate state rendering, curated settings, alias precedence, constraints, atomic updates, state refetch, revision refresh, and no automatic migration.
  - Bounded parent paging, lazy child paging, flat fallback, direct/deep-linked selection, off-page parent handling, provenance rendering, and empty/error states.
  - Preview blocker/informational presentation, classification counts, selected-document paging, confirmations, stale-preview recovery, filtered plan history, polling, item paging, status explanations, and closed-mode retry.
- Advanced Search tests:
  - Ready, blocked, text-only, and empty-corpus readiness; fail-fast `409`; readiness invalidation.
  - Default evidence text, omitted blank maximum, concurrent submissions, status polling, cancellation, and direct run links.
  - Reloaded history query previews/options and full query detail.
  - Completed, partial, insufficient-evidence, unavailable-answer, interrupted, queue-full, expired, and malformed/unsupported-version scenarios.
  - Claim-to-evidence references, snapshotted source labels, legacy metadata fallback, chunk deep links, separate contexts, collapsed diagnostics, and missing excerpts.
- Navigation/regression tests:
  - New sidebar routes and direct URL rendering.
  - Documents-to-Chunking and Search-to-Chunking navigation.
  - Queries retains four supported workflows and no Hybrid Search tab.
  - Knowledge-base changes discard incompatible run/document/plan selections and refetch scoped readiness/previews.
- Add deterministic Playwright flows with mocked `/api/v1` responses for scalable chunk inspection/migration preview and readiness-aware durable advanced search.
- Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, `npm run test:e2e`, and `openspec validate --all`.

## Assumptions and Defaults

- This remains a frontend-only change against backend contracts through `c5dc2a2`; no backend DTO or endpoint changes are included.
- Runtime chunk settings and `GET /api/v1/chunking-state` are global, while chunk inspection, migration previews/plans, and advanced-search runs are scoped to the selected knowledge base.
- Advanced-search history uses the server-provided bounded `queryPreview`; owned run detail supplies the full query while the run remains within retention.
- Advanced search does not require an active schema: missing schema means text-only operation. Missing embedded corpus is informational and may lead to an insufficient-evidence answer.
- Migration readiness and selected counts come from the side-effect-free preview and are revalidated by plan creation; a preview never reserves work or guarantees later admission.
- Migration history is filtered server-side with `reason=CHUNK_STRATEGY_MIGRATION`, so page totals describe only chunk migrations.
- Chunk inspection uses bounded hierarchy/page/direct reads; the legacy complete-list route is compatibility-only.
- Evidence source labels are immutable snapshots for newly produced results and nullable on legacy version-1 results.
- Evidence excerpts are requested by default, but users may disable them per run.
- Raw metadata and diagnostics remain available for operators without dominating the knowledge-worker experience.
