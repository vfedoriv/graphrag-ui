## ADDED Requirements

### Requirement: Builder renders readable relationship context
The system SHALL render Schema Builder relationship edges so labels are visually associated with their own edge, selected relationships are more prominent than unselected relationships, and the nodes connected to the selected relationship are visually highlighted.

#### Scenario: Relationship labels remain associated with their edges
- **WHEN** the Schema Builder canvas renders multiple relationships near each other
- **THEN** each visible relationship label SHALL be positioned and styled so it is clearly associated with its relationship edge
- **AND** labels SHALL avoid appearing as if they belong to unrelated nearby edges whenever the canvas has enough space to separate them
- **AND** labels SHALL remain clickable/selectable controls for their own relationship

#### Scenario: Relationship paths remain direct where possible
- **WHEN** the Schema Builder canvas renders a relationship between two different nodes
- **THEN** the relationship line SHALL use a smooth curved path that is direct between the selected attachment points
- **AND** the system SHALL avoid adding a forced middle bend when a mostly straight path is readable
- **AND** repeated or nearby relationship paths MAY use slight curve separation so they can be distinguished
- **AND** relationship paths MAY render below node cards when avoiding the node would create a less readable route

#### Scenario: Select relationship edge
- **WHEN** a user selects a relationship edge in the Schema Builder canvas
- **THEN** the selected edge SHALL use a stronger visual treatment than unselected edges
- **AND** the selected edge label SHALL remain readable above other canvas content
- **AND** the source and target nodes for that relationship SHALL be highlighted as related to the selected relationship

#### Scenario: Select unrelated canvas element
- **WHEN** a user selects a different relationship or node in the Schema Builder canvas
- **THEN** relationship emphasis and connected-node highlights SHALL update to match the current selection
- **AND** nodes not connected to the selected relationship SHALL NOT retain the relationship-connected highlight

#### Scenario: Connect relationship from node attachment points
- **WHEN** a user creates or reconnects a relationship in the Schema Builder canvas
- **THEN** the user SHALL be able to attach the relationship to available attachment points on the top, right, bottom, or left side of a node
- **AND** the selected attachment points SHALL influence the rendered relationship path
- **AND** reconnecting an existing relationship SHALL update the relationship source and target nodes when they change

#### Scenario: Relationship readability does not change schema content
- **WHEN** relationship edge labels, selected edge emphasis, or connected-node highlights are rendered
- **THEN** the serialized schema JSON SHALL remain based on the draft nodes and relationships only
- **AND** the system SHALL NOT add presentation-only fields to schema API payloads
- **AND** relationship label offsets, selected attachment handles, selected element state, and connected-node highlight flags SHALL remain presentation-only state
