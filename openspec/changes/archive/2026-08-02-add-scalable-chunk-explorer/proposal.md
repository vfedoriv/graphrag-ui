## Why

The Documents page currently downloads and renders the complete chunk list, which does not scale and cannot reliably deep-link to cited evidence. The backend now provides bounded hierarchy summaries, filtered pages, and direct lookup, enabling a dedicated explorer that remains usable for large and legacy documents.

## What Changes

- Add a URL-addressable Chunk Explorer view under `/chunking?view=chunks` with reload-safe `documentId` and `chunkId` parameters.
- Select documents from the active knowledge base and inspect chunks only through bounded hierarchy, filtered page, and direct-lookup routes.
- Page metadata-only parent summaries, lazily page children per expanded parent, and fall back to bounded flat-chunk paging for non-hierarchical or legacy documents.
- Fetch selected chunks directly for authoritative text and complete provenance, including source ranges, structural path, processing run, strategy/revision metadata, tokenizer, hashes, confidence, and raw metadata.
- Resolve chunk deep links by direct lookup first, expand the containing parent when discoverable, and preserve off-page selections with paged-navigation guidance.
- Replace inline Documents chunk rendering with an `Inspect chunking` link while retaining upload, replacement, deletion, processing, and parser/OCR options.
- Clear document/chunk IDs that are invalid for a newly selected knowledge base and show an explanatory notice rather than silently changing knowledge bases.

## Capabilities

### New Capabilities

- `scalable-chunk-inspection`: Bounded hierarchical and flat chunk exploration, direct authoritative lookup, provenance display, and reload-safe deep links.

### Modified Capabilities

- `document-ingestion-and-processing`: Move chunk inspection out of Documents while preserving its ingestion, processing, and option workflows.
- `documents-inline-upload-and-scrollable-chunks`: Replace the legacy inline complete-list chunk output with a handoff to the scalable Chunking explorer.

## Impact

This change affects the Chunking workspace, Documents actions, document/chunk query behavior, URL state, error/empty states, and component/E2E tests. It depends on `align-frontend-advanced-operations-contracts` and the `/chunking` shell introduced by `add-chunking-strategy-management`.
