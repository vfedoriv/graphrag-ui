## 1. Candidate Filtering Model

- [x] 1.1 Add typed candidate-filter state/defaults and a pure helper that applies trimmed case-insensitive text matching plus exact kind, recommendation, normalized review-state, and included-origin criteria.
- [x] 1.2 Add focused unit tests covering blank and case-insensitive text, canonical and original coordinates, relationship endpoints and keys, every categorical dimension, `null`/`PENDING` unreviewed normalization, AND composition, and stable input order.

## 2. Candidates Workbench Controls

- [x] 2.1 Add the labeled search, candidate-kind, analyzer-recommendation, review-state, and origin controls above the Candidates queue with unfiltered defaults and user-facing option labels.
- [x] 2.2 Wire the organized candidate result through filtering before pagination, reset to the first page on criteria changes, and clamp refreshed filtered results to a valid page.
- [x] 2.3 Add clear-all behavior, matching-versus-complete result context, filtered pager totals, and the dedicated no-matching-candidates empty state.
- [x] 2.4 Add responsive filter-toolbar styling that follows existing form patterns and avoids horizontal overflow at supported viewport widths.

## 3. Workbench Verification

- [x] 3.1 Extend Schema Drafts workbench interaction tests for accessible labels, initial unfiltered results, individual and combined criteria, clear-all behavior, and remount defaults.
- [x] 3.2 Add interaction coverage for filter-before-pagination, first-page reset, matching/complete totals, pager boundaries, and zero-match feedback without stale rows.
- [x] 3.3 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`, resolving any regressions while preserving existing candidate review behavior.
