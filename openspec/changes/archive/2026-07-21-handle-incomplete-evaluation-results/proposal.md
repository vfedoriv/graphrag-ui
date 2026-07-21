## Why

The backend returns `null` run-level metrics and advisory assessment while an evaluation is queued or running, and may also omit them for an interrupted run. The frontend currently rejects those valid status responses, shows an unexpected-shape error, and stops polling instead of presenting evaluation progress.

## What Changes

- Accept evaluation status responses whose result objects are not yet available.
- Continue polling queued and running evaluations and show their aggregate progress and per-document outcomes.
- Render deterministic metrics and advisory assessment only when each result is available, with an explicit progress or unavailable state otherwise.
- Align frontend outcome statuses with the backend contract, including queued, running, and reused outcomes.
- Add contract and workflow tests for in-progress and interrupted evaluation responses while retaining strict rejection of undeclared fields.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-evaluation-ui`: Define how the UI accepts and presents evaluation status resources before result objects exist and after interruption.

## Impact

- Affects evaluation response types and Zod validation under `src/features/schema-drafts`.
- Affects held-out evaluation progress and result rendering in the schema draft release workflow.
- Affects API validation and workflow test fixtures for evaluation polling.
- Does not change backend endpoints, request bodies, or response contracts.
