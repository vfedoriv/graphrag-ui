## Context

The Documents page currently loads chunks through the existing document chunks query and renders the full response with `JSON.stringify` inside `OutputPreview`. This preserves backend fidelity but makes common review tasks difficult because each chunk's `text` value can be very long and dominates the surrounding metadata.

The UI should remain controller-oriented and frontend-only. The backend contract does not need to change; the improvement is a presentation change over the same chunk DTOs.

## Goals / Non-Goals

**Goals:**

- Make chunk inspection readable by default with one visible unit per chunk.
- Preserve raw JSON access for debugging, support, and API verification.
- Keep large chunk text and large chunk arrays bounded inside the Documents page layout.
- Keep implementation local to the Documents workflow unless a small reusable primitive is clearly useful.
- Add tests for the default readable view and raw JSON mode.

**Non-Goals:**

- Changing document chunk API response shape or backend processing behavior.
- Adding chunk editing, annotation, deletion, or export workflows.
- Adding full-text search, highlighting, pagination, or virtualization in this change.
- Introducing a new JSON viewer dependency.

## Decisions

- Default to a readable chunk view with an explicit `Raw JSON` mode.
  - Rationale: most users are inspecting extracted content and metadata, not validating transport-level JSON. Raw JSON remains available when exact payload shape matters.
  - Alternative considered: keep JSON and collapse only `text` fields. That is lower effort but still requires users to mentally parse object syntax and is less readable for non-debug inspection.

- Render chunks as cards, one card per chunk.
  - Rationale: cards provide a stable scanning structure for `chunkIndex`, identifiers, token estimates, metadata source, and text. This fits the existing controller page style better than a dense table with very long text cells.
  - Alternative considered: split list/detail viewer. That scales better for very large chunk sets, but it adds selection state and more interaction complexity than this readability-focused change requires.

- Wrap readable chunk text while preserving whitespace.
  - Rationale: document text often contains line breaks and spacing that help users recognize source structure. Wrapping prevents horizontal scrolling from becoming the primary reading mechanism.
  - Alternative considered: truncate text by default. Truncation reduces vertical space but hides the exact extracted content users are trying to inspect.

- Keep raw JSON inside the existing bounded output preview.
  - Rationale: the current raw behavior is useful for debugging and already handles oversized payloads with dual-axis scrolling.
  - Alternative considered: remove raw JSON entirely. That would lose useful support and development diagnostics.

## Risks / Trade-offs

- Large chunk sets can make the readable view vertically long -> keep the card list in a bounded scrollable region so the page remains stable.
- Long chunk text can still be visually dense -> use clear labels, compact metadata rows, and whitespace-preserving wrapped text blocks.
- Unknown or evolving metadata fields could be hidden if only `source` is shown -> show source prominently and keep full raw JSON mode available for complete metadata inspection.
- Tests may become brittle if they assert exact long text -> assert mode controls, labels, and representative content rather than full payload dumps.
