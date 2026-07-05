## Why

Schema authoring is currently JSON-centered: users can generate, validate, create, and update schema content, but they must understand the full serialized document structure to add nodes, properties, relationships, and relationship properties. A dedicated visual builder would make schema composition easier while preserving the existing backend contract that stores schema `content` as JSON.

## What Changes

- Add a dedicated Schema Builder workspace where users can visually compose GraphRAG schema elements:
  - node labels and node properties
  - relationship types between nodes
  - relationship properties
  - schema metadata needed by create/update flows
- Allow users to start from an existing schema selected from the current knowledge base, a blank builder draft, or pasted/generated JSON.
- Keep a synchronized JSON preview/editor so the visual builder remains compatible with existing validation, create, and update API payloads.
- Provide actions to validate the builder draft, create a new schema, or update the selected existing schema through the current `/api/v1/schemas` contract.
- Use React Flow as the selected implementation approach, with a graph canvas, custom node/edge rendering, and side-panel inspectors for schema element editing.
- No backend API changes are required for the initial version.

## Capabilities

### New Capabilities
- `visual-schema-builder`: Dedicated schema builder workspace, schema import/export mapping, visual node/relationship/property editing, validation, create, and update behavior.

### Modified Capabilities
- `admin-app-shell-and-navigation`: Add navigable access to the Schema Builder workspace while preserving existing controller navigation behavior.
- `schema-management-and-activation`: Allow existing schema management flows to hand off schema content into the builder and receive builder output for validation, creation, or update.

## Impact

- Affected frontend code under `src/app`, `src/features/schemas`, a likely new `src/features/schema-builder`, shared UI primitives, and schema API hooks.
- New dependency: `@xyflow/react` for the selected React Flow graph canvas approach.
- Existing schema API payloads remain serialized JSON strings in `content`; no backend contract changes are planned.
- Tests should cover schema import/export mapping, visual editing behavior, validation/create/update actions, navigation, and preservation of existing Schemas page workflows.
