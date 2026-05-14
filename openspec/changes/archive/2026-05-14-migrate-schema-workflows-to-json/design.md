## Context

The frontend currently models schema workflows with mixed YAML/JSON terminology and behaviors, while the backend now enforces JSON schema format. Existing schema tabs, payload editors, and test expectations still reference YAML-specific names and formatting in several places. The migration must preserve existing controller-page workflow shape while replacing schema-specific behavior, API helpers, and output handling so users operate entirely in JSON.

Key constraints:
- This repo is frontend-only and must consume backend endpoints as-is.
- Existing archived OpenSpec artifacts remain historical and are not rewritten.
- Migration should avoid partial hybrid states where tabs are renamed but payload semantics remain YAML-based.

## Goals / Non-Goals

**Goals:**
- Deliver JSON-only schema workflows for create, validate, generate, and schema retrieval display.
- Align schema API helpers and typed models with JSON naming and backend payloads.
- Use backend multipart file endpoints for file-driven schema generation/example workflows.
- Keep workflow usability intact: generated schema remains editable and transferable into validate/create flows.
- Update tests to codify JSON-only behavior and prevent YAML regressions.

**Non-Goals:**
- Adding backward-compatibility adapters for YAML schema content.
- Changing backend endpoint contracts.
- Changing unrelated controller pages or introducing new auth/security features.

## Decisions

1. JSON-only schema contract in UI
- Decision: Treat schema format as `JSON` for active schema workflows and remove YAML presentation/formatting from schema-facing UI text and editor format configuration.
- Rationale: Matches backend contract and removes ambiguous dual-format UX.
- Alternative considered: Keep YAML parser/formatter as fallback for legacy content; rejected because it extends broken compatibility and increases maintenance.

2. Rename schema workflow state and API helpers to JSON semantics
- Decision: Replace YAML-oriented identifiers with JSON-oriented names (`schemaJson`, `generateJson`, JSON-focused request/response DTO naming).
- Rationale: Prevents semantic drift and lowers future maintenance errors.
- Alternative considered: Keep existing names and only change labels; rejected because internal naming would continue to encode obsolete behavior.

3. File-based generation uses backend multipart endpoints directly
- Decision: For file tabs, submit selected files to `/schemas/generate/from-file` and `/schemas/generate/example/from-file` with required multipart fields.
- Rationale: Aligns with backend responsibility for parsing/generation and avoids fragile client-side file-to-text assumptions.
- Alternative considered: Continue client-side file text reading and call text endpoints; rejected as incompatible with backend migration intent.

4. Unsupported schema formats are surfaced as unsupported state
- Decision: If stale/non-JSON format values are returned, UI should surface unsupported format state rather than coercing values.
- Rationale: Preserves data correctness and exposes integration drift early.
- Alternative considered: Silent coercion to JSON; rejected due to hidden data integrity risk.

5. Schema-related test IDs are fully renamed to JSON terms
- Decision: Rename schema workflow test IDs from YAML wording to JSON wording without preserving legacy YAML suffix aliases.
- Rationale: Keeps automated checks and UI semantics consistent with the JSON-only contract and prevents mixed-format drift.
- Alternative considered: Keep legacy YAML test ID aliases for compatibility; rejected to avoid carrying stale terminology.

## Risks / Trade-offs

- [Residual YAML references in tests or labels] -> Mitigation: broad text/test-id sweep and focused schema workflow test updates.
- [Multipart request regressions] -> Mitigation: API tests asserting `FormData` fields and endpoint paths.
- [Migration introduces UI copy inconsistency] -> Mitigation: update fixed tab order and all schema labels in one coordinated change.
- [Legacy backend data with non-JSON format appears] -> Mitigation: explicit unsupported-format UI state and requirement-level coverage.

## Migration Plan

1. Update specs and proposal/design/tasks artifacts to define JSON-only schema workflows.
2. Implement schema DTO/API updates (format typing, JSON naming, multipart helpers).
3. Update Schemas page tabs, labels, workflow handlers, and payload editor format usage.
4. Remove schema YAML formatting pathways and runtime `yaml` dependency if no remaining runtime usage.
5. Update/extend tests for JSON-only editor behavior, schema workflow labels/order, and multipart APIs.
6. Run validation suite: `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`.

Rollback strategy:
- Revert frontend migration commit(s) to restore prior UI behavior if backend compatibility issue is discovered.
- Because backend contract is already JSON-migrated, rollback is for short-term incident recovery only.

## Open Questions

None.

Resolved assumption:
- The backend data set is expected to contain only JSON schema records after migration; non-JSON records are not expected in normal operation.
