## Context

The Schema Builder page renders graph schema drafts in `src/features/schema-builder/SchemaBuilderPage.tsx` using `@xyflow/react`. Nodes are mapped from draft nodes, edges are mapped from draft relationships, and the current selected element drives node or relationship editing in the side panel. Relationship edges currently use React Flow's built-in smoothstep edge label rendering, which can place labels directly over nearby edges or labels in dense layouts.

This change improves the readability of the existing canvas without changing schema draft data, relationship editing, serialization, or backend API payloads.

## Goals / Non-Goals

**Goals:**

- Make each relationship label easier to associate with its own edge in the React Flow canvas.
- Give selected relationship edges a stronger visual treatment than unselected edges.
- Highlight the selected relationship's source and target nodes.
- Keep the solution localized to Schema Builder canvas presentation and selection state.
- Preserve existing raw JSON synchronization, draft validation, create, update, and import behavior.

**Non-Goals:**

- Change backend schema contracts or add presentation metadata to serialized schema content.
- Replace React Flow or introduce a new graph layout engine.
- Automatically reroute every relationship to eliminate all possible edge intersections.
- Redesign the whole Schema Builder page or side panel.

## Decisions

1. Use a custom Schema Builder edge renderer for relationship labels and paths.

   The current built-in label option is concise but offers limited control over label offset, stacking, selected label emphasis, and how edge paths relate to custom attachment points. A custom React Flow edge type renders direct cubic Bezier relationship paths and labels with `EdgeLabelRenderer` and explicit styles. This gives the implementation a single place to tune label background, border, pointer behavior, z-index, per-edge label offset, and selected-edge stroke treatment.

   Alternative considered: keep built-in labels and only adjust CSS. That is lower effort but does not provide enough control for selected label layering, label click selection, or offsetting parallel/nearby labels.

2. Derive visual relationship state from existing `selectedElement`.

   The selected relationship is already stored as `{ kind: 'relationship'; id }`. The canvas can derive selected edge styling and connected-node state from that value without introducing separate selection state. Node data can include an `isRelationshipEndpoint` flag for the custom node renderer to apply an endpoint highlight.

   Alternative considered: store selected source and target node ids in independent state. That duplicates derived state and risks stale highlights after relationship endpoint edits or removal.

3. Keep presentation data outside schema serialization.

   Edge label offsets, selected styles, z-index, route attachment handles, and endpoint highlight flags should live only in React Flow node and edge data or transient component state. The existing mapping and serialization functions remain responsible for schema content.

   Alternative considered: persist layout or relationship display metadata in the draft. That would increase the chance of leaking presentation-only fields into schema JSON and is unnecessary for this readability fix.

4. Use deterministic label offset and route separation rules before adding heavier collision handling.

   The implementation offsets labels based on relationship order and same-source or nearby grouping, then layers selected labels above unselected labels. Relationship paths are routed from deterministic candidate attachment points on all node sides and use small curve separation for repeated or nearby routes. This is predictable, testable, and avoids the confusing forced middle bends that appeared with more aggressive curve routing.

   Alternative considered: add dynamic collision detection for all label bounding boxes. That may improve some layouts, but it adds complexity and can produce unstable label movement during pan, zoom, and node dragging.

5. Support attachment-point reconnect without persisting route handles.

   React Flow source and target handles are exposed on the top, right, bottom, and left sides of each schema node. New relationships and reconnect operations can capture selected handles in presentation state, and reconnecting an edge updates the relationship's source and target node ids when those endpoints change. Handle choices are intentionally not serialized into schema JSON.

   Alternative considered: make attachment points part of the draft model. That would make visual routing durable across reloads, but it would change the schema contract and introduce presentation metadata into payloads.

## Risks / Trade-offs

- Custom edge rendering may need careful CSS to remain readable at different zoom levels -> Mitigate by using React Flow label rendering primitives and verifying live canvas screenshots.
- Deterministic offsets reduce but cannot eliminate every possible overlap in very dense graphs -> Mitigate by emphasizing selected relationships and keeping selected labels layered above other canvas content.
- Direct cubic curves can still cross in dense graphs -> Mitigate by keeping curves visually simple, allowing paths to render below node cards, and prioritizing selected-edge clarity over complete automatic edge avoidance.
- Endpoint highlighting could be confused with normal node selection if styles are too similar -> Mitigate by using a distinct but compatible visual treatment for relationship-connected nodes.
- Edge styling changes may be difficult to assert through jsdom alone -> Mitigate with focused unit tests for derived node/edge state and browser screenshot checks for visual behavior during implementation.
