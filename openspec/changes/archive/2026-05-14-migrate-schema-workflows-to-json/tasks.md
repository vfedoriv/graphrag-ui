## 1. Spec And API Contract Alignment

- [x] 1.1 Update schema API DTOs and types to JSON-first contract (`SchemaFormat = 'JSON'`, schema details content typing, JSON-oriented request/response naming).
- [x] 1.2 Add multipart schema API helpers for `generateJsonFromFile` and `generateExampleFromFile` with required `FormData` fields and existing `apiFetch` content-type behavior.
- [x] 1.3 Update schema API tests to cover new multipart endpoints, request body structure, and JSON response handling.

## 2. Schema Workflow UI Migration

- [x] 2.1 Replace schema-page YAML terminology in tab labels, field labels, placeholders, progress text, and user-facing validation/error wording with JSON terminology.
- [x] 2.2 Rename schema workflow state/actions from YAML-oriented names to JSON-oriented names and keep generated schema output editable for downstream validate/create actions.
- [x] 2.3 Update file-based generation tabs to submit selected files to backend multipart endpoints instead of client-side file-text generation flows.

## 3. Structured Editor And Format Handling

- [x] 3.1 Configure schema-oriented `StructuredPayloadEditor` usage to `format='json'` for create, validate, generation outputs, and schema examples.
- [x] 3.2 Remove schema YAML formatting pathways and runtime YAML dependency where no remaining runtime consumers exist.
- [x] 3.3 Ensure non-JSON schema format values from API are surfaced with an explicit unsupported-format UI state.

## 4. Workflow Order, Tests, And Validation

- [x] 4.1 Update Schemas tab order to: Generate schema example from text, Generate schema example from file, Generate schema JSON, Generate schema JSON from file, Validate schema JSON, Create schema, Get schema by ID.
- [x] 4.2 Update schema workflow and shared editor tests for JSON-only behavior, fully renamed JSON test IDs (no YAML aliases), and generated output propagation.
- [x] 4.3 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`; resolve regressions.
