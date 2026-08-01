## Context

Documents currently uses `GET /documents/{documentId}/chunks` and materializes all text. The backend now offers metadata-only hierarchy pages, filtered full-chunk pages, and direct chunk lookup. The explorer must support hierarchical, flat, legacy, empty, and deep-linked states without assuming that the selected row is on the current page.

## Goals / Non-Goals

**Goals:**

- Keep every collection read bounded and page-driven.
- Make a directly addressed chunk inspectable even when its outline row is off-page.
- Display complete text/provenance only for the selected chunk.
- Move chunk inspection out of Documents while preserving all ingestion workflows.

**Non-Goals:**

- Offer chunk editing or deletion.
- Infer or rebuild hierarchy client-side from the compatibility complete-list route.
- Automatically change the globally selected knowledge base to satisfy a deep link.

## Decisions

### Model URL state as validated workspace selection

`view=chunks`, `documentId`, and `chunkId` are parsed from search parameters. A KB change clears IDs before scoped queries are reused. A direct lookup `404`, ownership mismatch, or document-list mismatch clears the incompatible identifier and displays a notice. Silently switching knowledge bases was rejected because global selection is explicit user context.

### Direct lookup has priority over outline discovery

When `chunkId` exists, fetch `/chunks/{chunkId}` first. If it is a child, request its parent directly if needed and load the parent's first child page; navigate to a later child page only when position metadata makes that deterministic. If the parent lies outside the current hierarchy page, keep the detail selected and offer outline navigation rather than scanning all pages.

### Separate hierarchy, child, flat, and detail caches

Hierarchy keys include document/page/size. Child-page keys include document/parent/page/size. Flat-page keys include document/page/size and optional section. Direct-detail keys include document/chunk. This avoids replacing metadata summaries with full DTOs and allows independent retry of failed branches.

### Choose mode from server counts, not guessed metadata

Load hierarchy first. Parent rows render from `content`; `flatChunkCount` indicates whether flat fallback exists. An empty parent page with a nonzero flat count activates flat paging. Mixed documents may expose both sections instead of discarding either population.

### Remove the legacy Documents inspector completely

Document row actions navigate to `/chunking?view=chunks&documentId=...`. Existing upload, process, options, source, replace, and delete behavior remains local to Documents. New-workspace tests assert that the complete-list route is never requested.

## Risks / Trade-offs

- [Deep-linked parent or child is off-page] → Preserve directly fetched detail and give explicit navigation/reveal actions without unbounded scans.
- [Legacy provenance is null] → Render `Not recorded` fields and raw metadata without treating absence as an error.
- [A document changes while pages are cached] → Invalidate all document-scoped chunk roots after processing/replacement/deletion and handle lookup `404` safely.
- [Many expanded parents generate requests] → Fetch children only on expansion and retain bounded per-parent pages.

## Migration Plan

1. Apply the contract foundation and Chunking shell.
2. Add explorer URL state, document selector, hierarchy/flat outline, and detail pane.
3. Add direct deep-link resolution and KB-change reconciliation.
4. Replace Documents inline chunk actions and remove compatibility-list consumers/tests.
5. Add component and mocked E2E coverage for hierarchical, flat, deep-linked, empty, and error cases.

## Open Questions

None. Directly fetched selection remains authoritative when outline location cannot be derived cheaply.
