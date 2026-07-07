## 1. Canvas State And Rendering

- [x] 1.1 Add derived Schema Builder canvas state that identifies the selected relationship and its source and target node ids from the existing draft and `selectedElement`.
- [x] 1.2 Extend Schema Builder React Flow node data so connected nodes can render a relationship-endpoint highlight distinct from normal node selection.
- [x] 1.3 Replace built-in relationship edge labels with a custom Schema Builder edge type that renders direct cubic relationship paths and labels through React Flow edge primitives.
- [x] 1.4 Add deterministic relationship label offset data so labels for nearby or repeated relationship paths are less likely to overlap unrelated lines or labels.
- [x] 1.5 Add deterministic relationship route selection across multiple attachment points on every node side.
- [x] 1.6 Keep relationship route overrides, label offsets, and endpoint highlights out of serialized schema JSON.

## 2. Visual Styling

- [x] 2.1 Style unselected relationship edges and labels so labels have a readable background, border, and pointer association with their own edge.
- [x] 2.2 Style selected relationship edges and labels with stronger stroke, label contrast, and canvas layering than unselected relationships.
- [x] 2.3 Style relationship-connected node highlights so source and target nodes are visible without being confused with the currently selected node.
- [x] 2.4 Style relationship paths so direct node-to-node relationships remain mostly straight, repeated paths get slight curve separation, and edge strokes can render below node cards.
- [x] 2.5 Verify responsive canvas behavior remains usable at the existing Schema Builder desktop and mobile breakpoints.

## 3. Tests And Validation

- [x] 3.1 Add focused tests for derived edge and node presentation state, including selected relationship endpoint highlights and clearing highlights after a different selection.
- [x] 3.2 Add or update Schema Builder tests to confirm presentation-only edge and node state does not change serialized schema JSON or API payload content.
- [x] 3.3 Add or update Schema Builder tests for custom cubic relationship paths and label click selection.
- [x] 3.4 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
- [x] 3.5 Run browser checks of the Schema Builder canvas against real backend schemas and capture that relationship labels, selected relationship emphasis, endpoint highlighting, and curve readability are visible.
