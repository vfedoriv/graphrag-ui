# Testing Gap Report

## Current Measurement

Measured on 2026-09-12 with `npm run coverage` after the focused document, Advanced Search, Schema Builder, and schema-draft suites were integrated. The run passed all 53 test files and all 390 tests.

| Metric | Covered / total | Measured coverage | Configured gate | Headroom |
| --- | ---: | ---: | ---: | ---: |
| Statements | 3,739 / 4,240 | 88.18% | 80% | 8.18 percentage points |
| Branches | 3,464 / 4,300 | 80.55% | 70% | 10.55 percentage points |
| Functions | 1,411 / 1,612 | 87.53% | 78% | 9.53 percentage points |
| Lines | 3,305 / 3,637 | 90.87% | 82% | 8.87 percentage points |

The gates above are the thresholds currently configured in `vitest.config.ts`. They remain unchanged in this measurement task; the next threshold-reassessment task must decide whether each gate can be raised while preserving a deliberate maintenance margin.

The normal substantial-change validation set remains:

- `openspec validate --all`
- `npm run lint`
- `npm run test:run`
- `npm run test:e2e`
- `npm run coverage`
- `npm run build`

## Closed Priority Items

The following high-risk gaps from the previous assessment are closed by executable regression tests in the measured run:

- **Document source and opening behavior:** target selection now covers local paths, supported and unsupported URIs, absent metadata, and malformed values. Local-open requests and the document workflow cover successful opening, structured and malformed failures, 404 and generic fallback guidance, blocked browser popups, clipboard fallback, and pending/error cleanup.
- **Document processing actions:** overwrite refusal, stale-status confirmation and retry, retry failure, save/clear failure retention, replacement, deletion failure, and row-specific pending cleanup are covered through observable calls and feedback.
- **Advanced Search lifecycle:** knowledge-base changes, cleared selection, mismatched/missing/expired focused runs, evidence-limit validation, queue conflicts, submission failures, cancellation failures, and terminal-state cancellation rules are covered through URL, cache, request, disabled-state, and notice assertions.
- **Schema workflows selected for this change:** candidate modify/pin validation and read-only behavior are covered, as are Schema Builder node and relationship add/remove, connect/reconnect validation, selected-element synchronization, load/validate/create/update failures, and guards for a missing knowledge base.

Playwright mock alignment and accessible/stable selector use remain testing guardrails, not open gaps: no concrete violation was identified during this closure work.

## Remaining Priorities

These items are ordered by user impact and state-transition risk, not by percentage alone.

1. **Reassess the global coverage gates against this baseline.** The new baseline leaves 8.18 to 10.55 percentage points of headroom, enough to justify reviewing every gate instead of carrying forward values selected for the older suite. Closure requires documenting a deliberate safety margin, changing only the thresholds supported by that margin, and recording a successful `npm run coverage` result with the resulting gates.
2. **Complete document processing-option editor state coverage.** `DocumentProcessingOptionsWorkflow.tsx` remains comparatively branch-light, especially around loading/no-data/error rendering and the boolean, constrained-integer, allow-listed, free-text, and read-only control variants. These branches can change parser inputs or hide actionable feedback. Closure requires focused interaction tests that render every control variant, assert constraints and displayed defaults, verify emitted draft values, and exercise loading, absent-data, and formatted-error states.
3. **Cover the remaining visual-builder synchronization transitions.** The highest-risk add/remove/connect/reconnect and API-failure paths are closed, but drag persistence, blank/import route synchronization, and invalid-to-valid raw JSON recovery still cross canvas, inspector, URL, and serialized-draft state. Closure requires tests that assert the observable canvas/inspector/JSON result for each transition and prove invalid input does not dispatch mutations.
4. **Exercise schema-draft list and workbench navigation states.** Candidate decision validation is closed, while list filtering/pagination, missing or failed draft loading, and returning between list and workbench remain separate controller paths. Their risk is stale review context or actions against the wrong draft. Closure requires route-level tests for filter reset and paging, loading/empty/error feedback, draft selection, and preserved draft identity during workbench actions.

Lower per-file coverage is not by itself a closure target. A remaining item may be removed when the stated behavior is covered by deterministic tests, or when maintainers document why the path is unreachable, browser-only and covered by Playwright, or too passive to justify a regression test.

## Refresh and Closure Criteria

Refresh this report after targeted gap-closure work or material production-source changes make the measurement or priorities stale. A refresh is complete only when `npm run coverage` succeeds, its date and exact numerator/denominator metrics are recorded, configured gates and headroom agree with `vitest.config.ts`, resolved priorities are explicitly moved to the closed list, and every remaining priority retains a workflow-specific rationale and executable closure criterion.

Generated coverage output remains under `coverage/` and is not source documentation.
