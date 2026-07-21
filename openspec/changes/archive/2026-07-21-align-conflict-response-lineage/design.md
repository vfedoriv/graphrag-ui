## Context

Schema-draft conflict data crosses a typed and runtime-validated boundary. `schemaDraftsApi.conflicts` validates list items with the strict `conflict` Zod schema, and `schemaDraftsApi.resolveConflict` validates its success body with the same schema. Backend commit `01d9c58` expanded `ConflictResponse` with a required aggregate revision identifier and a derived currentness flag, and changed the list endpoint to default to current-aggregate conflicts while reserving `scope=ALL` for history.

Because the frontend schema is strict, otherwise-compatible response expansion is rejected as an unknown-key error. The current UI does not need to display the new fields, but its compile-time and runtime contracts must represent them accurately.

## Goals / Non-Goals

**Goals:**

- Accept the backend's complete conflict response on both list and resolution paths.
- Preserve strict runtime validation, including required string/boolean validation for the new fields.
- Keep the existing current-aggregate review behavior and tests aligned with realistic backend payloads.
- Add regression coverage that would fail if either response path omitted support for the new fields.

**Non-Goals:**

- Adding a conflict-history view, scope selector, or `scope=ALL` request.
- Displaying aggregate lineage or currentness in the existing conflict cards.
- Changing query keys, mutation invalidation, endpoint paths, or request payloads.
- Supporting old and new conflict payloads simultaneously; the frontend targets the current backend contract.

## Decisions

### Model both fields as required response properties

Add `aggregateRevisionId: string` and `current: boolean` to `ConflictResponse` and the strict Zod object. This mirrors the backend record, where both fields are always serialized, and preserves contract-drift detection. Making them optional or allowing unknown keys would hide backend/frontend mismatches and weaken the validation boundary.

### Reuse the existing conflict validator for both response paths

The list and resolution endpoints return the same backend DTO and already share the same frontend schema. Updating that single schema keeps their behavior consistent; no endpoint-specific parser is needed.

### Continue relying on the backend's default conflict scope

Leave `schemaDraftsApi.conflicts` unchanged. Its unscoped request now resolves to backend `CURRENT`, which matches the UI's active-review intent and the existing empty/current-aggregate states. Adding `scope=CURRENT` explicitly would be redundant, while `scope=ALL` would mix historical conflicts into a mutable review queue that is not designed to present lineage.

### Make shared fixtures contract-complete and test both parsing contexts

Update the reusable typed conflict fixture and any inline conflict payloads with a representative aggregate ID and `current: true`. Exercise a list response and a successful resolution response through the actual API/UI path so strict parsing is covered in both contexts. No rendering assertion for the new fields is required because there is intentionally no UI change.

## Risks / Trade-offs

- [A stale mock without the new required fields fails before exercising its intended behavior] → Update every conflict fixture and inline response located by repository search, then run focused schema-draft tests.
- [Future history UI accidentally reuses current-only assumptions] → Keep `scope=ALL` explicitly out of this change and require a separate design for historical ordering, currentness presentation, and mutation rules.
- [Type and runtime schemas drift again] → Keep field names and requiredness identical in the TypeScript type and strict Zod schema, with parser-level regression coverage.
