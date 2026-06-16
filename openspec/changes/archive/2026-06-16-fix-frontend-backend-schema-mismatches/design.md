## Context

The frontend is a React 19 + Vite TypeScript admin UI that consumes the GraphRAG backend REST API under `/api/v1`. Recent backend DTOs include fields that the frontend either omits or models with mock-era aliases:

- `GenerateSchemaResponse` returns `content` and advisory `warnings`.
- Hybrid search hits return graph context under `graph`, relationships use `startNodeElementId` and `endNodeElementId`, and graph entities do not include a separate `type` field.
- Backend `ProblemDetail.errors` is not a single shape; validation errors may be field maps with string values, request-level lists, or schema/query error lists.

The backend contract is treated as authoritative for this change. No backend edits are planned.

## Goals / Non-Goals

**Goals:**

- Make frontend DTO types match the current backend response shapes.
- Render schema generation warnings where users already inspect generated schema output.
- Render hybrid search graph context without relying on frontend-only aliases.
- Normalize representative backend `ProblemDetail.errors` variants without breaking existing user-facing error messages.
- Update regression tests to use backend-shaped fixtures.

**Non-Goals:**

- No backend API changes.
- No redesign of schema generation or hybrid search workflows.
- No new graph visualization dependency.
- No broader runtime validation library adoption for all DTOs.

## Decisions

1. Keep backend field names in frontend DTOs for current contracts.

   Hybrid search should type and render `graph`, `startNodeElementId`, and `endNodeElementId` directly. Backward-compatible optional aliases can remain only where they protect existing tests or older mocked payloads, but new tests should use the backend shape. This avoids hiding contract drift behind frontend-only names.

2. Surface schema generation warnings as advisory UI near generated output.

   The schema generation endpoints still return usable `content` when warnings exist. The UI should not block editing, validation, or creation; it should display warning code/message/suggestions beside the generated output so users can decide whether to adjust the schema before continuing.

3. Normalize `ProblemDetail.errors` into stable frontend structures.

   The shared API client should accept `errors` as field maps, string maps, arrays, or unknown values. Field maps should populate `ApiError.fieldErrors`; request-level arrays should remain accessible on the error object or contribute to a normalized details list. The main `message` should continue to prefer `detail`, then `title`, then the default fallback.

4. Use focused tests rather than broad runtime schema validation.

   The mismatch is limited and concrete. Updating TypeScript types, fixtures, and focused API/component tests gives sufficient regression coverage without introducing another parsing dependency or large adapter layer.

## Risks / Trade-offs

- Backend may add more optional DTO fields later -> Keeping types explicit and tests backend-shaped makes future drift easier to spot.
- Warning UI can add noise to generation workflows -> Render warnings only when returned and keep the generated schema editor as the primary workflow surface.
- Supporting old hybrid search aliases can preserve stale assumptions -> Keep aliases only as transitional tolerance if needed, and make all new tests assert the current backend shape.
