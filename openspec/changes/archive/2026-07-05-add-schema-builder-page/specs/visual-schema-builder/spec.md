## ADDED Requirements

### Requirement: Schema Builder page provides a visual draft workspace
The system SHALL provide a dedicated Schema Builder page where users can create or edit a schema draft through visual controls for schema metadata, nodes, node properties, relationships, and relationship properties.

#### Scenario: Open Schema Builder page
- **WHEN** a user opens the Schema Builder page
- **THEN** the system SHALL render selected knowledge-base context
- **AND** the system SHALL render controls to start from a blank schema draft, import an existing schema, or edit schema JSON
- **AND** the system SHALL render a visual schema workspace separate from the existing Schemas page workflow tabs

#### Scenario: Start blank schema draft
- **WHEN** a user starts a blank builder draft
- **THEN** the system SHALL create an editable schema draft with empty nodes and relationships
- **AND** the system SHALL require the user to provide schema name and positive version before create or update submission succeeds

### Requirement: Builder imports existing schema content
The system SHALL allow users to load an existing schema into the builder and map supported schema JSON fields into editable visual elements.

#### Scenario: Import existing schema
- **WHEN** a user selects an existing schema for builder import
- **THEN** the system SHALL retrieve that schema's details by schema id
- **AND** the system SHALL map `nodes` into visual node elements
- **AND** the system SHALL map `relationships` into visual relationship elements connected to their `from` and `to` node labels
- **AND** the system SHALL map node and relationship `properties` into editable property lists

#### Scenario: Preserve advanced fields during import
- **WHEN** imported schema content contains `indexes`, `vectorIndexes`, or other top-level fields not edited as first-class visual elements
- **THEN** the system SHALL preserve those fields in the serialized schema draft unless the user changes them through raw JSON editing

#### Scenario: Import invalid schema JSON
- **WHEN** an imported or pasted schema content value cannot be parsed as JSON
- **THEN** the system SHALL preserve the raw content
- **AND** the system SHALL show visible parse feedback
- **AND** the system SHALL NOT replace the user's content with an empty builder draft

### Requirement: Builder supports node and property editing
The system SHALL allow users to add, update, and remove schema nodes and node properties from the visual builder while keeping the serialized schema draft current.

#### Scenario: Add node
- **WHEN** a user adds a node in the builder
- **THEN** the system SHALL add a node definition with editable label, description, key, and properties
- **AND** the system SHALL include that node in the serialized schema JSON content

#### Scenario: Edit node property
- **WHEN** a user adds or changes a node property
- **THEN** the system SHALL capture property name, type, and required flag
- **AND** the system SHALL include the property under the owning node in serialized schema JSON content

#### Scenario: Remove node
- **WHEN** a user removes a node
- **THEN** the system SHALL remove that node from serialized schema JSON content
- **AND** the system SHALL visibly identify or remove relationships that referenced the removed node so the draft cannot silently submit broken endpoints

### Requirement: Builder supports relationship and relationship property editing
The system SHALL allow users to add, update, reconnect, and remove schema relationships and relationship properties from the visual builder.

#### Scenario: Add relationship
- **WHEN** a user connects two schema nodes or otherwise creates a relationship between them
- **THEN** the system SHALL add a relationship definition with editable type, from node, to node, description, and properties
- **AND** the system SHALL include that relationship in serialized schema JSON content

#### Scenario: Edit relationship property
- **WHEN** a user adds or changes a relationship property
- **THEN** the system SHALL capture property name, type, and required flag
- **AND** the system SHALL include the property under the owning relationship in serialized schema JSON content

#### Scenario: Relationship endpoints stay valid
- **WHEN** a user changes relationship endpoints
- **THEN** the system SHALL ensure the serialized relationship `from` and `to` values reference existing node labels
- **AND** the system SHALL show visible feedback when a relationship cannot be serialized with valid endpoints

### Requirement: Builder synchronizes visual and raw JSON editing
The system SHALL keep the visual builder draft and raw JSON content synchronized without discarding invalid user input.

#### Scenario: Visual edit updates JSON
- **WHEN** a user changes schema metadata, nodes, properties, relationships, or relationship properties through visual controls
- **THEN** the system SHALL update the raw JSON preview to the serialized schema content represented by the visual draft

#### Scenario: Valid raw JSON updates visual draft
- **WHEN** a user edits raw JSON content and the content is valid schema JSON
- **THEN** the system SHALL update the visual builder draft to match the parsed content

#### Scenario: Invalid raw JSON blocks visual synchronization
- **WHEN** a user edits raw JSON content so it cannot be parsed
- **THEN** the system SHALL preserve the invalid raw text
- **AND** the system SHALL keep visible parse feedback in the builder
- **AND** the system SHALL disable create and update actions until the raw JSON can be parsed into a builder draft

### Requirement: Builder validates and submits through existing schema APIs
The system SHALL validate, create, and update schema drafts from the builder through the existing schema API payloads without requiring backend contract changes.

#### Scenario: Validate builder draft
- **WHEN** a user validates a builder draft
- **THEN** the system SHALL call `POST /api/v1/schemas/validate` with the serialized schema JSON in the existing `content` field
- **AND** the system SHALL render validation success or errors in the builder context

#### Scenario: Create schema from builder draft
- **WHEN** a user creates a schema from a valid builder draft while a knowledge base is selected
- **THEN** the system SHALL call `POST /api/v1/schemas` with serialized `content`, supported `sourceType`, and selected `knowledgeBaseId`
- **AND** the system SHALL refresh the selected knowledge base's schema list after successful creation

#### Scenario: Update schema from builder draft
- **WHEN** a user updates an imported existing schema from a valid builder draft
- **THEN** the system SHALL call `PUT /api/v1/schemas/{schemaId}` with replacement serialized `content` and supported `sourceType`
- **AND** the system SHALL refresh schema detail and selected knowledge-base schema queries after successful update

#### Scenario: Submit failure preserves draft
- **WHEN** builder validation, creation, or update fails
- **THEN** the system SHALL keep the user's current builder draft visible
- **AND** the system SHALL render the normalized API error in the builder context
