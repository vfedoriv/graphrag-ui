## Why

The repository's testing gap report is required by current quality governance, but it no longer records a dated measured baseline or concrete, closable risks. Current coverage remains above its gates while several high-impact controller branches—especially document source handling and Advanced Search lifecycle state—remain materially weaker than the aggregate numbers suggest.

## What Changes

- Refresh the testing gap report with dated measurements, threshold headroom, concrete priorities, risk rationale, and closure criteria.
- Add focused regression tests for document source/opening failures, document processing actions, and Advanced Search run lifecycle edge cases.
- Add selective tests for uncovered Visual Schema Builder interactions and schema-draft candidate decision validation without pursuing coverage percentage for its own sake.
- Re-run the complete validation surface, record the resulting baseline, and ratchet coverage thresholds only when the improved baseline leaves a deliberate safety margin.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `test-coverage-and-quality-governance`: make the required gap plan measurable and dated, define closure evidence for prioritized gaps, and require threshold changes to follow targeted risk-based coverage improvements.

## Impact

- Affected tests: focused Vitest suites under `src/features/documents`, `src/features/advanced-search`, `src/features/schema-builder`, and `src/features/schema-drafts`.
- Affected documentation and configuration: `docs/testing-gap-report.md` and, only if supported by the new measured baseline, `vitest.config.ts`.
- Validation: `openspec validate --all`, `npm run lint`, `npm run test:run`, `npm run test:e2e`, `npm run coverage`, and `npm run build`.
- APIs and runtime behavior: no backend contract, runtime dependency, or intended product behavior changes.
