## Why

Schema Builder nodes currently remain visually fixed at their original position while a user drags them, then jump to the new position after drop. This makes placement imprecise because the user cannot see the node's live target position before committing the move.

## What Changes

- Show a visible schema node shape that tracks the pointer during node dragging in the React Flow canvas.
- Keep the persisted draft position update on drop, while allowing the drag preview to reflect the in-progress position.
- Preserve current schema JSON serialization and backend API payloads; drag feedback is presentation behavior only.
- Add regression coverage for visible in-progress node movement where practical with the existing React Flow test setup.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `visual-schema-builder`: schema nodes must provide clear live visual feedback while being dragged before drop.

## Impact

- Affected UI: `src/features/schema-builder/SchemaBuilderPage.tsx` and related flow/CSS/test files.
- Affected behavior: React Flow schema node dragging in the Schema Builder canvas.
- APIs/dependencies: no backend contract changes and no required dependency changes expected.
