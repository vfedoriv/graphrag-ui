## 1. Approach and Setup

- [x] 1.1 Select React Flow as the implementation approach.
- [x] 1.2 Confirm route placement and navigation treatment for Schema Builder.
- [x] 1.3 Confirm whether `indexes` are first-class visual controls or advanced JSON-only preservation in the initial version.
- [x] 1.4 Add `@xyflow/react` and required React Flow styles.
- [x] 1.5 Create the `src/features/schema-builder` module structure and route entry.

## 2. Builder Draft Model

- [x] 2.1 Define feature-local schema builder draft types for metadata, nodes, properties, relationships, advanced fields, and source schema metadata.
- [x] 2.2 Implement schema JSON import from serialized `content` into a builder draft.
- [x] 2.3 Implement builder draft serialization back to stable pretty-printed schema JSON content.
- [x] 2.4 Preserve imported `indexes`, `vectorIndexes`, and unknown top-level fields through serialization when they are not edited visually.
- [x] 2.5 Implement local builder validation for blank metadata, duplicate labels/types, missing node keys, unresolved relationship endpoints, and invalid raw JSON.
- [x] 2.6 Add focused unit tests for import, serialization, advanced field preservation, and local validation.

## 3. Schema Builder Page UI

- [x] 3.1 Build the Schema Builder page shell with selected knowledge-base context and blank/import/raw JSON entry points.
- [x] 3.2 Implement the selected visual workspace for nodes and relationships.
- [x] 3.3 Add visual controls to create, select, rename, and remove schema nodes.
- [x] 3.4 Add inspector controls for node descriptions, keys, and node properties.
- [x] 3.5 Add visual controls to create, select, reconnect, and remove relationships.
- [x] 3.6 Add inspector controls for relationship type, description, endpoints, and relationship properties.
- [x] 3.7 Add synchronized raw JSON preview/editing using the existing schema JSON editor behavior.
- [x] 3.8 Add responsive layout styling for desktop canvas use and stacked mobile/tablet editing.

## 4. API Integration and Handoff

- [x] 4.1 Wire existing schema detail retrieval into builder import by schema id.
- [x] 4.2 Wire builder validation to `POST /api/v1/schemas/validate` using serialized `content`.
- [x] 4.3 Wire create from builder to `POST /api/v1/schemas` with selected `knowledgeBaseId` and supported `sourceType`.
- [x] 4.4 Wire update from builder to `PUT /api/v1/schemas/{schemaId}` and refresh related schema queries.
- [x] 4.5 Add visible pending, success, parse-error, validation-error, and API-error states in the builder context.
- [x] 4.6 Add Schemas page row action to open an existing schema in the builder.
- [x] 4.7 Add generated schema JSON handoff to open unsaved generated content in the builder.
- [x] 4.8 Preserve all existing Schemas page workflows after builder access is added.

## 5. Tests and Validation

- [x] 5.1 Add navigation tests for the Schema Builder route and active nav state.
- [x] 5.2 Add builder workflow tests for blank draft creation, existing schema import, visual edits, raw JSON sync, and invalid raw JSON preservation.
- [x] 5.3 Add API workflow tests for builder validation, create, update, query invalidation, and submit failure draft preservation.
- [x] 5.4 Add Schemas page handoff tests for row import and generated JSON draft handoff.
- [x] 5.5 Add responsive or browser-level coverage for the selected visual workspace if canvas behavior cannot be reliably asserted in jsdom.
- [x] 5.6 Run `npm run lint`.
- [x] 5.7 Run `npm run test:run`.
- [x] 5.8 Run `npm run coverage`.
- [x] 5.9 Run `npm run build`.
