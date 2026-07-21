## Context

The evaluation-eligibility endpoint now returns draft-wide `readiness` and `blockingReason` fields in addition to the existing page and authority fields. The frontend validates the response with a strict Zod object that does not declare those properties, so valid HTTP 200 responses fail parsing. The frontend type also permits only `ACTIVE_DISCOVERY_EVIDENCE` as a document-level ineligibility reason even though the backend returns `DRAFT_ANALYSIS_REQUIRED` when the draft is not ready.

## Goals / Non-Goals

**Goals:**

- Align compile-time and runtime eligibility contracts with the current backend.
- Restore eligible-document selection for ready drafts.
- Present accurate draft-wide and document-level blocking explanations.
- Cover both ready and analysis-required responses through real parsing and workflow tests.

**Non-Goals:**

- Changing eligibility calculation, pagination, endpoint paths, or start-evaluation requests.
- Adding new readiness or ineligibility enum values beyond the current backend contract.
- Changing publication-readiness behavior.

## Decisions

### Model backend enums explicitly

Introduce `EvaluationReadiness = 'READY' | 'NOT_READY'` and `EvaluationIneligibilityReason = 'ACTIVE_DISCOVERY_EVIDENCE' | 'DRAFT_ANALYSIS_REQUIRED'`. Use the reason type for both page-level `blockingReason` and document-level `ineligibilityReason`, with nullability matching the backend.

### Keep strict validation

Add required `readiness` and nullable `blockingReason` fields to the strict eligibility schema rather than weakening it with passthrough behavior. The current backend always serializes these fields, and strict validation should continue detecting future drift.

### Gate interaction from authoritative readiness

Treat `readiness === 'READY'` as a prerequisite in addition to the existing authority-staleness and document-selection checks. When readiness is `NOT_READY`, show the page-level blocking reason and disable all document selection and evaluation start even if a malformed or future response marks a row eligible.

### Render reasons through an exhaustive mapping

Map `ACTIVE_DISCOVERY_EVIDENCE` to the existing discovery-evidence explanation and `DRAFT_ANALYSIS_REQUIRED` to an analysis-required explanation. Reuse the same mapping for rows and the page-level block so the UI does not substitute a generic or incorrect cause.

### Exercise the actual API parser

Update shared fixtures with the new fields and add an API test that passes the expanded response through `schemaDraftReleaseApi.eligibility`. Workflow tests cover a ready page with selectable documents and a not-ready page with analysis-required rows and disabled controls.

## Risks / Trade-offs

- [A fixture omits required fields and obscures its intended assertion] → Update the shared fixture first and derive all variants from it.
- [Unknown future enum values become contract failures] → Preserve strict enum validation intentionally; add support when the backend contract expands.
- [Page readiness and row eligibility disagree] → Fail safe in the UI by requiring page readiness before enabling selection.

## Migration Plan

Deploy the frontend after or together with backend commit `53618a3`, which already emits the expanded response. Rollback requires a frontend version whose parser matches the deployed backend; no data migration is involved.

## Open Questions

None.
