## Context

The Documents page currently follows a tabbed endpoint workflow pattern. This change simplifies that page into a direct inline workflow: upload remains visible in-page, while processing and chunk inspection are driven by row-level actions from the documents table. Chunk output must be displayed in a constrained text viewport to avoid layout overflow with long lines or large chunk payloads.

## Goals / Non-Goals

**Goals:**
- Remove tab navigation from the Documents page.
- Keep upload action visible as part of the primary Documents page flow.
- Preserve `View chunks` from the document list and show chunk output inline.
- Ensure chunk text rendering uses both vertical and horizontal scrolling in a bounded container.

**Non-Goals:**
- No backend API changes for upload, process, or chunks endpoints.
- No cross-page chunk viewer or modal redesign.
- No changes to other controller pages unless needed by shared tab behavior configuration.

## Decisions

1. Documents page becomes inline-first instead of tab-first.
Rationale: The page contains a tight set of related operations where tab switching adds extra clicks without improving clarity.
Alternative considered: Keep tabs and only restyle chunk output. Rejected because the request explicitly removes tabs and endpoint separation.

2. Processing and chunk inspection remain action-driven from document rows.
Rationale: Existing user intent is document-specific, and row-level actions keep context tied to the selected document.
Alternative considered: Global process/chunks forms at page bottom. Rejected because they require re-selecting IDs and reduce usability.

3. Chunk output remains text-based but in a fixed-height, overflow-enabled panel.
Rationale: Raw chunk content is best inspected as text, but unbounded width/height harms layout and readability.
Alternative considered: Auto-wrapping with no horizontal scroll. Rejected because preserving raw line shape is important for debugging and inspectability.

## Risks / Trade-offs

- Risk: Removing tabs may reduce consistency with other controller pages. -> Mitigation: Update shared controller tab requirements to explicitly allow Documents page inline workflow.
- Risk: Large chunk payloads may still impact render performance. -> Mitigation: Use bounded container and avoid rendering extra derived views.
- Risk: Test regressions where tab interactions were asserted. -> Mitigation: Replace tab-centric tests with inline workflow and scrollbar behavior assertions.

## Migration Plan

1. Update OpenSpec requirements for document ingestion and controller tab behavior.
2. Implement Documents page layout change and remove tab wiring for process/chunk sections.
3. Update chunk output component styling to enforce horizontal and vertical scroll in a constrained area.
4. Update workflow tests to cover inline upload and action-driven chunk inspection.

## Open Questions

- None.
