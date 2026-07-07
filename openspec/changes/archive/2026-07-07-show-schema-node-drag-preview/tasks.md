## 1. Ghost Drag Feedback

- [x] 1.1 Add presentation-level drag preview state for the Schema Builder React Flow canvas.
- [x] 1.2 Render a distinct dashed node preview during drag while keeping the real schema node at its committed position.
- [x] 1.3 Keep connected relationship edges anchored to the committed node position during drag.

## 2. Commit And Reset Behavior

- [x] 2.1 Persist the final dropped node position through the existing draft update path.
- [x] 2.2 Reset drag preview state when the builder draft is replaced, imported, cleared, parsed from raw JSON, or dropped.
- [x] 2.3 Ensure drag-preview-only state is not serialized into schema API payloads.

## 3. Verification

- [x] 3.1 Add or update tests covering in-progress node position updates and dropped-position persistence.
- [x] 3.2 Run focused tests for the schema builder drag behavior.
- [x] 3.3 Run project validation appropriate for the UI change.
