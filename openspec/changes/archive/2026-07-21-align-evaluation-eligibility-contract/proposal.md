## Why

The backend now returns draft-wide `readiness` and `blockingReason` fields on evaluation-eligibility pages, but the frontend's strict Zod schema rejects them as unknown. As a result, a successful HTTP 200 response with eligible documents is shown as malformed and held-out evaluation cannot start.

## What Changes

- Extend the evaluation-eligibility TypeScript and strict Zod contracts with required readiness and nullable blocking-reason fields.
- Represent both backend ineligibility reasons, including `DRAFT_ANALYSIS_REQUIRED`, in per-document response types.
- Use draft-wide readiness and blocking reason to render accurate guidance and disable evaluation selection when analysis is required.
- Render per-document ineligibility copy from the actual backend reason instead of always claiming active discovery evidence.
- Update fixtures and add API/workflow regression tests for ready and not-ready eligibility pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-evaluation-ui`: Accept the expanded eligibility response contract and present authoritative draft-wide and per-document eligibility reasons.

## Impact

- Affected frontend code: `schemaDraftReleaseTypes.ts`, `schemaDraftReleaseValidation.ts`, `SchemaDraftReleaseWorkflow.tsx`, eligibility fixtures, API tests, and workflow tests.
- Affected API contract: eligibility pages require `readiness: 'READY' | 'NOT_READY'` and `blockingReason: 'DRAFT_ANALYSIS_REQUIRED' | null`; document reasons may also be `DRAFT_ANALYSIS_REQUIRED`.
- No backend change or endpoint/request change is required for this compatibility fix.
