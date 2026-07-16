## Why

The Schema Draft Candidates review queue currently exposes a flat, paged sequence, making it difficult to understand which properties belong to each proposed node and to review the strongest schema suggestions first. The pagination summary also leaves the meaning of the total count implicit.

## What Changes

- Organize candidates into a deterministic review sequence: each node followed immediately by its node properties, followed by all relationships after the node groups.
- Rank node groups from strongest to weakest using analyzer confidence and independent-source support, while keeping every property attached to its matching node.
- Rank properties within each node from highest confidence and greatest independent-source support to lowest, and apply stable tie-breaking so the order does not jump between renders.
- Rank relationships from recommended and high-confidence/high-support candidates to low-support candidates, with stable tie-breaking.
- Apply the organization to the complete candidate result before slicing it into UI pages so node/property grouping and relationship placement remain consistent across page boundaries.
- Clarify every Schema Draft workbench pager summary as `Page <n> · <count> items total`, including analysis, Candidates, release eligibility, evaluation, and reprocessing lists and histories.
- Add focused tests for hierarchy, ranking, null-confidence handling, deterministic ties, page boundaries, and pager wording.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Define hierarchical, signal-aware candidate ordering and explicit item-count wording across analysis and Candidates workbench pagers.
- `schema-draft-publication-ui`: Define explicit item-count wording for all paged eligibility, evaluation, and reprocessing views in the Release workbench.

## Impact

- Affects the Schema Draft analysis, Candidates, and Release workbench UI, candidate presentation/ordering helpers, candidate query orchestration, and associated Vitest coverage.
- Continues to consume the existing `/api/v1` paged candidate contract; no backend contract or dependency change is required.
- May require loading multiple backend candidate pages to construct the globally ordered client-side sequence before presenting UI pages.
