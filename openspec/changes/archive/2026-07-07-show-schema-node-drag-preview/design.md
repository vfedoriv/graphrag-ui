## Context

The Schema Builder canvas uses React Flow with controlled `nodes` derived from the schema draft. The current implementation persists a node's new position only in `onNodeDragStop`, so the controlled node data can keep the rendered node at its previous position until the drop event updates the draft. Users need a live placement cue while dragging, but the real node and connected relationship lines should stay stable until the drop is committed.

The change is frontend-only. Node positions remain presentation state inside the builder draft and no schema API contract changes are required.

## Goals / Non-Goals

**Goals:**

- Render a distinct drag-preview node shape at the in-progress drag position while the pointer moves.
- Keep the real schema node and connected relationship lines at their committed positions during drag.
- Persist the final node position to the draft and serialized JSON after drop.
- Preserve existing schema validation, creation, update, import, and raw JSON behavior.

**Non-Goals:**

- No backend API changes.
- No change to the schema content model beyond the existing node `position` presentation data.
- No redesign of React Flow node cards, relationship routing, minimap, or controls.

## Decisions

- Treat node drag movement as preview state, not controlled node state.
  - Rationale: The real schema node should remain at the committed position while a dashed ghost preview follows the drag position. This avoids continuous edge rerouting and canvas churn while still showing the target drop location.
  - Alternative considered: update controlled node positions through `onNodesChange`. That made the real node and relationship canvas update continuously, which is not the intended drag-and-drop interaction.

- Render the drag preview through React Flow viewport-relative content.
  - Rationale: A `ViewportPortal` preview can be positioned in flow coordinates, so the dashed shape follows pan and zoom consistently without mutating the actual node list.
  - Alternative considered: render an absolutely positioned page overlay from screen coordinates. That would need additional coordinate conversion and could drift under pan or zoom.

- Commit the final position in the existing `onNodeDragStop` path.
  - Rationale: The persisted draft and raw JSON should reflect only completed node placement. This keeps current serialization behavior stable and avoids partial edits if a drag is canceled or interrupted.
  - Alternative considered: immediately commit on each intermediate change. This was rejected for the same churn and synchronization reasons above.

## Risks / Trade-offs

- Preview state can drift from the draft if it is not reset after imports, blank drafts, raw JSON edits, or drop. -> Clear drag preview state whenever the draft is replaced, parsed from raw JSON, or a drag stops.
- The preview is not a real React Flow node, so handles and edge previews are intentionally absent during movement. -> Keep the preview visually distinct and use it only as a placement cue.
- Existing tests may mock React Flow too lightly to cover real pointer movement. -> Add focused unit coverage for the state/update path and use browser-level coverage later if pointer behavior cannot be represented in jsdom.
