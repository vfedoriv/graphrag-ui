## Context

The Candidates section requests one backend page of 25 `CandidateResponse` items and renders that page in response order. Candidate kinds include nodes, node properties, node keys, relationships, and relationship properties. Because parents and children can land on different backend pages, sorting only the visible page cannot guarantee the requested node/property hierarchy or keep all relationships after all node groups.

The frontend must preserve the existing `/api/v1` contract and the existing meaning of analyzer confidence, independent-source support, and recommendation state. User review state is intentionally independent and does not affect analyzer ordering.

## Goals / Non-Goals

**Goals:**

- Present one stable logical sequence: node, its properties/keys, the next node and its properties/keys, then relationships and their properties.
- Put stronger node and property suggestions before weaker ones, and prioritize relationship recommendations explicitly.
- Preserve UI pagination and decision behavior while organizing the complete candidate result.
- Make null signals, missing parents, and equal-ranked candidates deterministic and lossless.
- Clarify that every workbench pager total counts items.

**Non-Goals:**

- Changing candidate DTOs, backend endpoint parameters, or backend sort behavior.
- Treating analyzer ordering as acceptance, rejection, or any other persistent review decision.
- Adding user-configurable sort controls, filtering, or collapsible hierarchy in this change.
- Changing pagination wording outside the Schema Draft workbench.

## Decisions

### Build a complete client-side candidate sequence before UI pagination

The candidate query layer will load the first backend page, derive the remaining page count from `totalElements` and `size`, fetch remaining pages through the same endpoint, and combine them by backend page index. The UI will then organize the combined result and slice it into 25-item UI pages.

This guarantees that a child is grouped with its parent in the logical sequence and that relationships cannot appear before nodes merely because of backend pagination. Sorting only each visible backend page was rejected because it cannot satisfy either property across page boundaries. A backend contract change was rejected because this repository must consume the existing REST API unchanged.

The aggregate query will retain a stable TanStack Query key scoped by knowledge base and draft and will remain covered by the existing candidate invalidation path after decisions or reanalysis.

### Use explicit, lexicographic strength tuples

Ordering will compare raw values rather than formatted percentages:

1. Node groups are ranked by their node candidate: confidence descending, null confidence last; then `supportCount` descending; then normalized node label and identity ascending as stable ties.
2. `NODE_PROPERTY` and `NODE_KEY` children within a node are ranked by confidence descending, null last; then `supportCount` descending; then candidate-kind rank (`NODE_KEY` before `NODE_PROPERTY` when signals tie); then normalized property/key title and identity ascending.
3. Relationship groups are ranked first by recommendation state: `RECOMMENDED`, `REVIEW_REQUIRED`, `LOW_SUPPORT`, `SUPPRESSED`; then confidence descending, null last; then `supportCount` descending; then normalized endpoints, relationship type, and identity ascending.
4. `RELATIONSHIP_PROPERTY` children follow their matching relationship and use confidence, support, normalized property name, and identity as their tie-break sequence.

Confidence is primary for nodes and node-owned candidates because the requested scan starts with high-confidence nodes and properties. Recommendation is primary for relationships because the requested relationship queue explicitly starts with recommended candidates and ends with low-support candidates. Persistent `effectiveReviewState` and origins do not participate in sorting.

### Group by canonical candidate coordinates without inventing candidates

Node properties and keys will match nodes by normalized node label. Relationship properties will match relationships by normalized `(fromLabel, relationshipType, toLabel)` coordinates. Normalization is used only for matching and stable comparison; displayed values and candidate identities remain unchanged.

No candidate may be dropped when its parent is absent or coordinates are incomplete. Unmatched node-owned candidates will be grouped by their available node label after complete node groups but before relationships. Unmatched relationship properties will appear after complete relationship groups. The UI will not fabricate a reviewable parent candidate because doing so could imply a backend proposal that does not exist.

### Keep pagination item-based

UI pages remain fixed-size slices of candidate items, not indivisible parent groups. A node can therefore be the last item on one page and its first property the first item on the next, but no unrelated candidate can be interposed in the global sequence. This preserves the current 25-item density and makes `totalElements` continue to mean candidates rather than groups.

Every Schema Draft workbench pager will render `Page {page + 1} · {total} items total`. This includes analysis source outcomes and history, Candidates, release eligibility, evaluation outcomes and history, and reprocessing plan items and history. The Candidates pager's previous/next boundaries will use the organized sequence length, and its current page will be clamped when refreshed data reduces the page count. Other pagers retain their existing navigation behavior; only their total-count wording changes.

## Risks / Trade-offs

- [Loading all candidate pages increases requests and transferred evidence compared with loading one page] → Fetch remaining pages concurrently after the first response, reuse TanStack Query caching, and show the organized queue only after the aggregate query resolves.
- [Backend data can change while multiple pages are being read] → Keep all reads under one query lifecycle and rely on existing invalidation/refetch behavior after revision-changing operations; candidate identities and stable ties prevent render-order jitter.
- [A large result increases client sorting cost] → Use one memoized `O(n log n)` organization pass per aggregate result and continue rendering only the current 25-item UI slice.
- [A parent and child can straddle a UI page boundary] → Preserve item-count pagination and global adjacency; changing to variable-sized group pages would make totals and navigation less predictable.
- [Unexpected or unmatched child coordinates could otherwise disappear] → Retain them in deterministic fallback sections and cover this behavior with unit tests.
