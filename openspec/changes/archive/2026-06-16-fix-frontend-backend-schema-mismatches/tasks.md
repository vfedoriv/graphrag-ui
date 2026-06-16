## 1. API Contract Types

- [x] 1.1 Add `SchemaGenerationWarning` and `warnings` to the frontend `GenerateSchemaResponse` type.
- [x] 1.2 Align hybrid search source, entity, relationship, hit, and graph context types with backend DTO fields including `graph`, `startNodeElementId`, and `endNodeElementId`.
- [x] 1.3 Broaden `ProblemDetail.errors` and `ApiError` details typing to represent field maps, string-valued field maps, and request-level error arrays.

## 2. API Normalization

- [x] 2.1 Update shared API error normalization to safely normalize backend `ProblemDetail.errors` variants.
- [x] 2.2 Preserve existing fallback message behavior for `detail`, `title`, null payloads, transport errors, and malformed successful JSON.
- [x] 2.3 Update query API tests to use backend-shaped hybrid search response fixtures.
- [x] 2.4 Add API client tests for string-valued field errors and request-level error arrays.

## 3. Schema Generation UI

- [x] 3.1 Render advisory warnings returned from `Generate schema JSON` without blocking generated schema editing.
- [x] 3.2 Render advisory warnings returned from `Generate schema JSON from file` without blocking generated schema editing.
- [x] 3.3 Add or update schema workflow tests for generated schema warning display.

## 4. Hybrid Search UI

- [x] 4.1 Update hybrid search graph context rendering to prefer the backend `graph` field.
- [x] 4.2 Render relationship start/end columns from `startNodeElementId` and `endNodeElementId`.
- [x] 4.3 Remove or revise mock-only graph entity `type` assumptions so entities render useful backend data from labels and properties.
- [x] 4.4 Add or update query workflow tests for backend-shaped hybrid search graph context.

## 5. Validation

- [x] 5.1 Run `npm run lint`.
- [x] 5.2 Run `npm run test:run`.
- [x] 5.3 Run `npm run build`.
