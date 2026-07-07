## ADDED Requirements

### Requirement: Builder shows live node drag feedback
The system SHALL render a distinct drag preview at a schema node's in-progress drag position while the user drags it in the Schema Builder canvas.

#### Scenario: Drag schema node before drop
- **WHEN** a user drags a schema node in the Schema Builder canvas and has not released the pointer yet
- **THEN** the system SHALL show a visually distinct node preview moving with the pointer or otherwise visibly located at the current drag position
- **AND** the original schema node SHALL remain visible at its committed position until drop
- **AND** connected relationship edges SHALL remain anchored to the committed node position until drop

#### Scenario: Drop schema node
- **WHEN** a user releases a dragged schema node in the Schema Builder canvas
- **THEN** the system SHALL persist the node at the dropped canvas position in the builder draft
- **AND** the drag preview SHALL disappear
- **AND** the serialized schema JSON SHALL NOT add drag-preview-only fields
