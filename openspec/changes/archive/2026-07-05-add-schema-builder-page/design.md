## Context

The UI is a React 19, Vite, and TypeScript frontend that manages schemas through existing `/api/v1/schemas` endpoints. The Schemas page already supports list, details, generate, validate, create, update, delete, and activate workflows. Schema content is currently a serialized JSON string passed as `content`.

The backend schema document shape is already graph-oriented:

- top-level metadata: `name`, `version`, optional `description`
- `nodes`: label, description, key, properties
- `relationships`: type, from, to, description, properties
- optional `indexes` and `vectorIndexes`

The builder should therefore be a frontend authoring surface over the existing schema JSON format, not a new backend model.

Context7 documentation checked for the candidate libraries:

- React Flow / `@xyflow/react`: controlled `nodes` and `edges`, custom `nodeTypes` and `edgeTypes`, event handlers, `onConnect`, `addEdge`, and `isValidConnection`.
- Rete.js: editor area/render plugins for React, node/socket/control customization, import/export patterns, and connection validation through editor pipes.
- dnd kit: `DragDropProvider`, sortable hooks, keyboard sensor support, and custom collision detection for accessible drag/drop block composition.

## Goals / Non-Goals

**Goals:**

- Provide a dedicated Schema Builder page for visual schema authoring.
- Import existing schema JSON into editable node, relationship, and property blocks.
- Support creating a schema from scratch without writing raw JSON first.
- Serialize builder edits back to the exact existing schema `content` contract.
- Let users validate, create, and update schemas from the builder.
- Preserve the existing Schemas page workflows and shared schema API hooks.
- Implement the selected React Flow graph-canvas approach while retaining the alternatives considered as rationale.

**Non-Goals:**

- No backend API changes.
- No authentication or authorization changes.
- No graph extraction, document processing, or query execution behavior changes.
- No collaborative editing or persisted local draft storage in the initial version.
- No full visual editor for every advanced schema field in the first pass; `indexes` and `vectorIndexes` can be preserved through import/export and exposed in advanced JSON editing.

## Decisions

### Use a Local Builder Draft Model

Create a feature-local draft model that is more UI-friendly than the backend JSON:

- schema metadata: name, version, description
- nodes: stable local id, label, description, key fields, property definitions
- relationships: stable local id, type, source node id, target node id, description, property definitions
- advanced fields: imported `indexes`, `vectorIndexes`, and unknown JSON fields to preserve when possible
- source metadata: source schema id, source type, selected knowledge base id

The mapper layer handles:

- `content` string -> parsed schema document -> builder draft
- builder draft -> stable pretty-printed JSON `content`
- valid raw JSON edits -> builder draft
- invalid raw JSON edits -> preserved raw text with visible parse feedback and disabled create/update until valid

Rationale: existing API hooks and tests already treat schema content as serialized JSON. A dedicated mapper keeps visual state clean without leaking canvas-library types into API modules.

Alternative considered: store the page state only as React Flow/Rete/dnd-kit data. Rejected because every backend operation still needs canonical schema JSON and the builder must remain resilient if the visual library changes later.

### Selected Approach: React Flow Graph Canvas

Use `@xyflow/react` as the selected implementation path.

React Flow maps most directly to this domain:

- schema nodes become custom React Flow nodes
- schema relationships become edges
- custom node and edge types can render concise labels and status
- controlled nodes/edges keep the graph in React state
- `isValidConnection` and `onConnect` support relationship creation rules
- inspector panels can edit selected node, relationship, and property details outside the canvas

Implementation shape:

- `SchemaBuilderPage` owns `SchemaBuilderDraft`.
- `SchemaGraphCanvas` adapts draft nodes/relationships to React Flow nodes/edges.
- `SchemaElementInspector` edits the selected schema node, relationship, or property list.
- `SchemaBuilderJsonPanel` reuses `SchemaJsonEditor` for synchronized raw JSON preview/editing.
- `schemaBuilderMapping.ts` parses and serializes schema JSON.
- The page uses existing schema API mutations for details, validation, create, and update.

Trade-off: React Flow gives graph interactions but not schema-specific forms. We still build property editors, duplicate-label checks, key validation hints, and schema serializer logic ourselves.

### Alternative 1: Rete.js Node Editor

Rete.js is appropriate if the builder should feel like a visual programming tool with sockets, controls embedded in nodes, and engine-style graph validation.

Benefits:

- nodes, sockets, controls, and connections are first-class concepts
- editor import/export can mirror builder drafts
- connection validation can be implemented through editor pipes
- embedded controls can make each schema block self-contained

Costs:

- multiple Rete packages/plugins add integration complexity
- the dataflow/workflow mental model is less natural for a schema registry than a graph diagram
- styling and testing are likely heavier than React Flow for this app's controller-page UI

Recommendation: choose Rete.js only if the desired UX is a block-programming canvas with node-local controls rather than a graph diagram plus inspector.

### Alternative 2: Form-First Block Builder with dnd kit

Use dnd kit for draggable palettes and sortable lists of nodes, properties, and relationships. Render relationships through selectors or a lightweight preview rather than making the canvas the primary editor.

Benefits:

- best fit for dense admin forms and precise property editing
- strong keyboard-accessible drag/drop primitives
- lower graph-layout risk
- easier to test with React Testing Library

Costs:

- relationships are less visually obvious
- adding a graph preview later likely introduces a second visualization library
- the result feels more like a structured form than a visual schema canvas

Recommendation: choose this if accessibility, data-entry density, and implementation speed matter more than direct graph manipulation.

### Navigation and Handoff

Add a dedicated Schema Builder route and navigation entry. Also add handoff controls from the Schemas page:

- row action: open existing schema in the builder
- generated JSON output action: open generated schema in the builder
- create/update workflows can continue using `SchemaJsonEditor`; they do not need to move into the builder

Rationale: the user asked for a dedicated page, but existing workflows should remain available for users who prefer JSON editing or generation-first flows.

Alternative considered: make the builder another Schemas purpose tab. Rejected because the builder needs a wider workspace, canvas controls, JSON side panel, and import controls that would crowd the existing Schemas controller page.

### Validation Boundary

Client-side validation should catch obvious builder issues before API submission:

- blank schema name or non-positive version
- duplicate node labels
- node key properties missing from the node property list
- blank relationship type
- duplicate relationship type
- relationship endpoints that do not resolve to known node labels

The backend validation endpoint remains authoritative. Builder validation results should show both local issues and backend validation errors when the user runs validation.

## Risks / Trade-offs

- [Risk] The selected visual library may fight the current controller-page layout on small screens. -> Mitigation: keep the canvas in a responsive full-width builder page, move property editing into inspector panels that stack on mobile, and verify common desktop/mobile viewports.
- [Risk] Import/export can lose advanced schema fields. -> Mitigation: preserve `indexes`, `vectorIndexes`, and unknown top-level fields unless the user edits them in raw JSON.
- [Risk] Visual edits and raw JSON edits can diverge. -> Mitigation: keep a single draft owner, update graph state only from valid JSON, and clearly mark invalid raw JSON as blocking create/update.
- [Risk] React Flow or Rete custom components can be harder to test than form controls. -> Mitigation: put schema mapping and validation in pure functions with focused tests, and keep canvas interaction tests limited to critical user workflows.
- [Risk] Adding another primary nav item increases navigation density. -> Mitigation: use concise label `Schema Builder` and keep Schemas as the registry/workflow page.

## Migration Plan

1. Add the `@xyflow/react` dependency and feature files.
2. Implement pure schema builder mapping and validation utilities first.
3. Add the builder route and navigation entry.
4. Wire import, raw JSON sync, validation, create, and update actions to existing schema API hooks.
5. Add tests for mapping, local validation, navigation, import, visual edits, raw JSON sync, and API submissions.
6. Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build` for substantial implementation.

Rollback: remove the builder route/nav entry and selected visual dependency. Existing Schemas page workflows and schema API modules remain unchanged.

## Open Questions

- Should `indexes` be first-class visual controls in the initial version, or should the builder preserve them through advanced JSON only?
- Should Schema Builder be a primary navigation item, or a dedicated `/schemas/builder` route linked from the Schemas page only?
