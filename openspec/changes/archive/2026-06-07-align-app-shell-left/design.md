## Context

The current GraphRAG UI shell visually centers the sidebar and main workspace inside a constrained page container. On wide browser windows this leaves large empty gutters on both sides, while the working content remains narrower than the available viewport. The user-provided `/documents` screenshot shows the left navigation starting far from the browser edge and the document workspace ending well before the right edge.

The requested change is presentational: the shell should feel like a controller workspace anchored to the viewport, with fixed navigation on the left and flexible working space on the right. Existing routes, navigation entries, active knowledge base behavior, API flows, and controller page internals should continue to work as they do today.

## Goals / Non-Goals

**Goals:**

- Anchor the desktop app shell near the left side of the viewport with consistent outer padding.
- Keep the left navigation panel at a stable fixed width so navigation does not stretch on wide screens.
- Let the right-side content column grow and shrink with the viewport.
- Preserve readable spacing inside the main content and avoid horizontal page overflow at practical viewport widths.
- Maintain responsive behavior for narrow windows.

**Non-Goals:**

- Redesigning controller page content, tables, forms, endpoint tabs, or shared UI primitives beyond what the shell layout requires.
- Changing navigation labels, routes, active knowledge base semantics, or API behavior.
- Adding new dependencies or a new layout framework.

## Decisions

1. Use the existing app shell as the implementation boundary.

   The layout issue is caused by the shell-level container behavior, not by individual controller workflows. Updating the shell keeps the change consistent across Dashboard, Knowledge Bases, Schemas, Documents, Queries, and Settings without touching feature logic.

   Alternative considered: update each feature page separately. That would duplicate spacing decisions and leave the centered shell problem unresolved.

2. Make the sidebar fixed-width on desktop and the main region flexible.

   The shell should use a two-column layout where the sidebar has a fixed basis and does not flex, while the main region uses the remaining width with `min-width: 0` so overflowing children can scroll inside their own containers when needed. This matches the requested left panel and right content behavior.

   Alternative considered: proportional columns. That would cause the sidebar to widen unnecessarily on large screens and narrow unpredictably as the viewport changes.

3. Replace full-shell centering with viewport-relative padding and full-width availability.

   The outer shell should avoid a narrow global max-width that creates large gutters. A small responsive page padding is still useful so content does not touch the browser chrome, but the right content should be able to expand to the available viewport width.

   Alternative considered: increasing the current max-width. That would reduce the issue only at some widths and retain unnatural centering.

4. Validate with browser resizing, not only static inspection.

   The requested behavior depends on how the layout reacts to viewport changes. Implementation should be checked across a wide desktop viewport similar to the screenshot, a normal laptop width, and a narrow viewport to confirm the sidebar/content relationship and page overflow behavior.

## Risks / Trade-offs

- Wide tables or action rows may reveal existing horizontal overflow inside feature content -> Keep overflow constrained to the relevant table or panel, and ensure the main region uses `min-width: 0`.
- Removing a global max-width can make some panels feel too wide -> Preserve internal content spacing and avoid stretching the fixed sidebar.
- Narrow viewport behavior can regress if the fixed sidebar is applied unconditionally -> Scope fixed-width behavior to desktop breakpoints and preserve or improve existing responsive stacking/collapse behavior.
