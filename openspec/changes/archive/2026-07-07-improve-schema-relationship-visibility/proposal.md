## Why

Relationship edges and labels in the Schema Builder canvas can overlap when several nodes and relationships are near each other, making it difficult to understand which label belongs to which line. Users also need clearer visual feedback when selecting a relationship so they can quickly identify its source and target nodes.

## What Changes

- Improve Schema Builder relationship rendering so edge labels remain visually associated with their own relationship line and are less likely to overlap unrelated lines or labels.
- Render relationship lines as direct smooth curves, using only slight curve separation for repeated or nearby paths instead of forced right-angle or midpoint detours.
- Make selected relationships more visually prominent in the React Flow canvas.
- Highlight the nodes connected to the selected relationship so the relationship context is immediately clear.
- Allow relationship labels to select their relationship and support relationship attachment/reconnection through available node-side attachment points.
- Preserve existing schema draft behavior, relationship editing, serialization, and backend API contracts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `visual-schema-builder`: add requirements for readable relationship edge labels, direct curved relationship paths, selected edge emphasis, connected-node highlighting, and node-side relationship attachment points in the Schema Builder canvas.

## Impact

- Affects Schema Builder React Flow rendering, edge styling, label placement, relationship endpoint handles, reconnect behavior, and selection state handling.
- May add focused tests around relationship selection and canvas element class/state derivation.
- No backend API, schema content, or persistence contract changes are expected.
