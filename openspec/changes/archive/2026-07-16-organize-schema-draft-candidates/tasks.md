## 1. Candidate Organization

- [x] 1.1 Add a feature-local candidate organization helper that groups nodes with node properties/keys and relationships with relationship properties while retaining unmatched children exactly once.
- [x] 1.2 Implement the specified confidence, support, recommendation-state, null-value, kind, coordinate, and identity comparators for deterministic ordering.
- [x] 1.3 Add unit tests covering shuffled input, node and child ranking, relationship ranking, null confidence, stable ties, all candidate kinds, and unmatched children.

## 2. Complete Candidate Query

- [x] 2.1 Add candidate query orchestration that reads the first backend page, fetches all remaining pages through the existing API, and combines them in backend page order under a stable draft-scoped query key.
- [x] 2.2 Preserve existing candidate invalidation and contract-error behavior for the aggregate query, including decision and reanalysis refresh paths.
- [x] 2.3 Add query tests for a single backend page, multiple pages, page-boundary parent/child data, empty results, and a failing page response.

## 3. Candidates UI Pagination

- [x] 3.1 Organize the complete candidate result once, slice it into 25-item UI pages, and render only the selected slice in the Candidates review queue.
- [x] 3.2 Clamp the selected UI page after refreshed data reduces the available page count and derive navigation boundaries from the organized total.
- [x] 3.3 Update every Schema Draft workbench pager summary to `Page <n> · <count> items total`, covering analysis, Candidates, release eligibility, evaluation, and reprocessing lists and histories.
- [x] 3.4 Extend Schema Draft page and release workflow tests to verify global candidate hierarchy across UI page boundaries, relationship placement, decision actions after reordering, page clamping, and exact pager wording for every workbench pager.

## 4. Validation

- [x] 4.1 Run `npm run lint` and resolve any new lint findings.
- [x] 4.2 Run `npm run test:run` and `npm run coverage`, resolving regressions and maintaining configured thresholds.
- [x] 4.3 Run `npm run build` and resolve any TypeScript or production-build failures.
