## Why

The backend now returns `aggregateRevisionId` and `current` on every schema-draft conflict response. The frontend's strict Zod parser currently rejects those responses, breaking both conflict listing and successful resolution handling even though the existing current-conflict review workflow remains valid.

## What Changes

- Extend the frontend `ConflictResponse` type and strict runtime schema with the required aggregate-lineage and currentness fields.
- Keep conflict-list requests unscoped so the backend's `CURRENT` default continues to serve the active review queue; do not add conflict-history UI or `scope=ALL` support.
- Update conflict fixtures and tests to use the expanded response contract and cover parsing of both list and resolution responses.
- Verify the focused schema-draft tests and normal frontend quality checks continue to pass.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Require the current conflict review surface to accept the backend's conflict lineage/currentness fields on list and resolution responses while continuing to request the default current scope.

## Impact

- Affected frontend code: `src/features/schema-drafts/schemaDraftTypes.ts`, `src/features/schema-drafts/schemaDraftValidation.ts`, and schema-draft conflict fixtures/tests.
- Affected API contract: conflict list items and conflict-resolution success bodies now require `aggregateRevisionId: string` and `current: boolean`.
- No backend changes, new dependency, query-key change, request-shape change, or visible workflow change is required.
