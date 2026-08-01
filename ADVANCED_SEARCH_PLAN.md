# Versioned Chunking and Advanced Search UI

## Summary

Add two first-class workspaces:

- `/chunking`: global chunk-strategy configuration, hierarchical chunk inspection, and knowledge-base reprocessing.
- `/advanced-search`: durable cited search runs, polling, cancellation, history, readable answers, and evidence.

Keep document upload and parser/OCR options on Documents. Keep Ask and Cypher tools on Queries, but remove the obsolete Hybrid Search workflow because its backend endpoint was deleted.

Create an OpenSpec change named `add-chunking-and-advanced-search-ui` before implementation, covering chunking management, advanced search, navigation, and removal of the legacy hybrid-search contract.

## Contract and API Alignment

- Extend frontend DTOs for the current backend without modifying backend contracts:
  - `RuntimeSetting`: add `activeValue`, `lifecycleState`, `effectiveChunkerRevision`, and `chunkMigrationLifecycle`.
  - `DocumentChunk`: add hierarchy, source range, structural path, processing run, hash, tokenizer, and revision fields; allow nullable fields for legacy chunks.
  - Generalize reprocessing types with `reason`, `selection`, `expectedChunkerRevision`, and `BLOCKED_TARGET_CHANGED`.
  - Add advanced-search request, run, page, answer, claim, evidence, graph-fact, limitation, and diagnostics types.
- Add advanced-search API operations and stable query keys:
  - Submit, list/filter/page, poll status, fetch result, and cancel.
  - Poll focused non-terminal runs every 1.5 seconds.
  - Fetch results automatically only for `COMPLETED` or `PARTIAL` runs.
- Use `maximumEvidence` in submission payloads—the actual backend record field—and default `includeEvidenceText` to `true`.
- Validate versioned result payloads as payload version 1 and retain a raw-JSON fallback if an unknown or malformed payload is returned.
- Extract reprocessing-plan API/types from the schema-draft feature into a shared domain module. Preserve existing schema-publication consumers while allowing unfiltered knowledge-base history for Chunking.
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
- Clear incompatible selected IDs when the global knowledge-base selection changes.

### Chunking workspace

- Divide the page into URL-addressable Strategy, Chunk Explorer, and Reprocessing views.
- Clearly distinguish global strategy configuration from knowledge-base-scoped documents and migrations.
- Strategy view:
  - Present curated canonical controls in a fixed order: strategy, target tokens, overlap, hard character limit, parent token/character limits, parent page limit, and contextual-header bounds.
  - Render enum and numeric controls from backend constraints.
  - Hide compatibility aliases `max-tokens` and `max-characters`.
  - Show representation and effective chunker revisions read-only.
  - Save changed settings atomically through the bulk runtime-settings endpoint.
  - After saving, refresh the effective revision and explain that existing documents were not changed; offer an explicit migration action without starting one automatically.
- Chunk Explorer:
  - Select from documents in the active knowledge base and load chunks only for that document.
  - Group `CHILD` chunks beneath expandable `PARENT` chunks in deterministic order.
  - Place legacy flat or orphaned children in a clearly labeled fallback group.
  - Show concise page, section, structural-path, child-count, and token summaries in the outline.
  - Show full authoritative text and complete provenance in a focused detail panel, including source offsets, processing run, strategy/effective revisions, tokenizer, hashes, confidence, and raw metadata.
  - When opened with `chunkId`, expand its parent, select it, and bring its detail into view.
  - Handle unprocessed documents, empty chunk results, legacy null metadata, and load errors explicitly.
- Reprocessing:
  - Require an active schema, active AI profile, and current `effectiveChunkerRevision`.
  - Make `OUTDATED_STRATEGY` the primary action.
  - Put `DOCUMENT_IDS` selection and forced `ALL` rebuild behind advanced scope controls; forced all requires stronger confirmation.
  - Submit `reason: CHUNK_STRATEGY_MIGRATION`, the chosen `selection`, the displayed `expectedChunkerRevision`, and document IDs only for `DOCUMENT_IDS`.
  - On stale-revision `409`, refresh settings, explain that the target changed, and require resubmission.
  - Show all server-paginated reprocessing plans because the backend has no reason filter; include Reason, Selection, Target Revision, Status, Progress, Target Currency, Retry Lineage, and Created columns.
  - Poll the selected active plan, page its items, explain `STALE_SOURCE`, `BLOCKED`, and `BLOCKED_TARGET_CHANGED`, and allow terminal unresolved work to retry only with explicit resnapshot enabled.

### Advanced Search workspace

- Make the question field and submit action primary.
- Put `maximumEvidence` and `includeEvidenceText` in collapsed advanced options:
  - Evidence text starts enabled.
  - Maximum evidence starts blank so the backend default applies.
  - Display backend-derived default/max hints when runtime settings are available.
- Allow multiple concurrent runs. Focus the newest submission while older runs continue in history.
- Show focused run stage, branch progress, evidence count, deadline/timestamps, cancellation state, and an idempotent Cancel action.
- Render terminal results for both `COMPLETED` and `PARTIAL`:
  - Answer status, readable answer text, confidence, and limitations.
  - Claim cards with citation chips; do not fabricate inline citation positions because the backend answer text has no citation markers.
  - Ranked evidence with filename resolved from the document list when available, source/page ranges, structural path, revision, score, and returned excerpt.
  - Graph facts and their evidence/citation references.
  - Citation links into the Chunking explorer.
  - Explicit presentations for insufficient evidence and answer unavailable.
- Keep planning, sufficiency, follow-up, retriever attempts, fusion, reranking, selection, answer diagnostics, and raw JSON in collapsed diagnostic sections.
- Add newest-first history with status filter and paging. History labels use run ID, status, stage, and timestamps because the backend history DTO does not expose the original query.
- Handle `429` queue-full, pre-result `409`, expired/not-owned `404`, interrupted runs, cancellation races, partial branch failures, missing evidence text, and unknown payload versions without losing the current question or history.

### Existing Queries and Settings

- Remove the Hybrid Search tab and update Queries copy, status summaries, runtime-setting hints, and pending-state aggregation.
- Keep Ask, Generate Cypher, Validate Cypher, and Execute Cypher unchanged.
- Keep all advanced-search runtime tuning in generic Settings; Advanced Search only exposes per-run evidence controls.
- Keep the generic Settings page capable of editing chunking settings, while the Chunking workspace provides the curated, explanatory surface.

## Test Plan

- API tests:
  - Exact advanced-search routes, `maximumEvidence` payload naming, cancellation, paging/filter parameters, query keys, terminal polling, and cache invalidation.
  - Rich chunk DTO mapping and migration payloads for outdated, selected, and all scopes.
  - Updated schema-reprocessing validators with new fields/statuses.
  - Confirm no request targets the removed hybrid-search endpoint.
- Chunking component/workflow tests:
  - Curated settings, alias hiding, constraints, atomic updates, revision refresh, and no automatic migration.
  - Parent/child grouping, legacy/orphan fallback, deep-linked selection, provenance rendering, and empty/error states.
  - Migration prerequisites, confirmations, stale-revision recovery, mixed plan history, polling, paging, status explanations, and retry resnapshot.
- Advanced Search tests:
  - Default evidence text, omitted blank maximum, concurrent submissions, status polling, cancellation, and direct run links.
  - Completed, partial, insufficient-evidence, unavailable-answer, interrupted, queue-full, expired, and malformed-version scenarios.
  - Claim-to-evidence references, document-name enrichment, chunk deep links, collapsed diagnostics, and missing excerpts.
- Navigation/regression tests:
  - New sidebar routes and direct URL rendering.
  - Documents-to-Chunking and Search-to-Chunking navigation.
  - Queries retains four supported workflows and no Hybrid Search tab.
  - Knowledge-base changes discard incompatible run/document/plan selections.
- Add deterministic Playwright flows with mocked `/api/v1` responses for chunk inspection/migration and durable advanced search.
- Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, `npm run test:e2e`, and `openspec validate --all`.

## Assumptions and Defaults

- This remains a frontend-only change against the backend contracts currently present after `f86555fa`; no backend DTO or endpoint changes are included.
- Runtime chunk settings are global, while chunk inspection and migrations are scoped to the selected knowledge base.
- Advanced-search history cannot display the submitted question after reload because `RunResponse` omits it; no local-storage substitute will be invented.
- Reprocessing history remains combined because the backend does not support filtering by plan reason.
- Evidence excerpts are requested by default, but users may disable them per run.
- Raw metadata and diagnostics remain available for operators without dominating the knowledge-worker experience.
