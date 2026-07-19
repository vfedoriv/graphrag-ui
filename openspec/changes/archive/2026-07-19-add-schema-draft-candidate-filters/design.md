## Context

The Candidates section currently loads the full paged backend result through `useSchemaDraftCandidatesQuery`, combines it into one client-side array, organizes that array into a deterministic schema-aware sequence, and then slices it into 25-item UI pages. Each `CandidateResponse` already contains the kind, coordinates, recommendation, effective review state, and origins required for filtering, so adding request parameters or changing the backend contract would duplicate data already available to the UI.

The filter controls must sit above the candidate queue, preserve the established review ordering, remain understandable at responsive widths, and continue to distinguish analyzer recommendation from persistent user review state.

## Goals / Non-Goals

**Goals:**

- Let reviewers narrow the complete candidate result by text, kind, recommendation, review state, and origin.
- Keep filtering deterministic, local, accessible, and independent from backend pagination or contracts.
- Make result counts, clearing criteria, pagination changes, and zero-match results explicit.
- Isolate matching logic so it can be covered with focused unit tests in addition to workbench interaction tests.

**Non-Goals:**

- Server-side filtering, new query parameters, or changes to candidate DTOs and query keys.
- Filtering decision history, conflicts, projections, or diffs.
- Persisting filters in the URL, browser storage, or across workbench navigation/remounts.
- Adding numeric confidence or support-range filters, saved filter presets, sorting controls, or automatic inclusion of a matching candidate's parent or children.

## Decisions

### Represent filters as explicit local state

The Candidates component will own a text query and one single-select value for each categorical dimension. Every categorical control will offer an `All` value. Review state options will present `PENDING` and `null` as the same user-facing `Unreviewed` category, matching the existing candidate presentation.

This keeps filter state scoped to the current review session and avoids expanding application routing or shared state. URL-backed filters were considered, but deep-linkable filter state is not required for this workflow and would add routing semantics beyond the request.

### Match the complete organized result before pagination

The existing `organizeCandidates` result will be passed through a pure filtering helper, and only then sliced into the 25-item UI page. All active criteria will use AND semantics. Origin selection will match candidates whose origins array contains that value. Categorical values use exact typed comparisons.

Text input will be trimmed and compared case-insensitively against the readable candidate definition and its searchable schema coordinates, including canonical and original values. An empty or whitespace-only query matches every candidate. Filtering the already-organized sequence preserves relative order and avoids changing the established ranking rules. Matching children will remain visible even if their parent does not match; automatically pulling relatives into the result was rejected because it makes filter totals and criteria less predictable.

### Keep controls explicit and results self-describing

The toolbar will use labeled native form controls consistent with the existing page. It will expose:

- Search text
- Candidate kind
- Analyzer recommendation
- Review state
- Origin
- Clear filters

User-facing option labels will reuse candidate presentation language where it exists. Clear filters will restore the unfiltered defaults. The result summary and pager will use the filtered count while retaining the complete candidate count as context, and an active-filter zero result will show a dedicated `No matching candidates` empty state instead of an empty queue.

### Clamp pagination synchronously from derived results

Any filter change will move the selected page to page zero. The existing last-page clamp will also be calculated from the filtered array so refreshed data cannot leave the UI beyond its final valid page. This gives reviewers a predictable starting point for new criteria and retains the current protection against shrinking result sets.

## Risks / Trade-offs

- [Client-side filtering depends on loading the complete candidate result] → Reuse the current all-pages loading path; do not advertise filters until candidate loading has completed under the existing query behavior.
- [A text query could feel inconsistent if searchable fields are implicit] → Define a stable search projection in one pure helper and test canonical, original, relationship-endpoint, and case-insensitive matches.
- [Many controls can crowd narrow viewports] → Use the existing responsive form-grid patterns and allow controls to wrap without horizontal overflow.
- [Filtered children can appear without parent context] → Keep each review item self-describing and document exact-match behavior rather than altering totals with implicit relatives.
- [Review state has both `null` and `PENDING` transport forms] → Normalize both to the single existing `Unreviewed` UI category before matching.
