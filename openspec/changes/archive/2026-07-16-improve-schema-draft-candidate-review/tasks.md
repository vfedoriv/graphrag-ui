## 1. Candidate Presentation Model

- [x] 1.1 Add feature-local pure helpers that produce readable candidate kind labels, coordinate-based titles, property types, relationship endpoints, and original-to-normalized change descriptions for every candidate kind.
- [x] 1.2 Add support and confidence formatters with zero, singular, plural, null-confidence, and percentage cases that preserve independent-source semantics.
- [x] 1.3 Add focused unit tests covering all candidate kinds, rename detection, support wording, and analyzer-versus-review state labels.

## 2. Compact Candidate Review Items

- [x] 2.1 Extract candidate rendering from the workbench controller into a feature-local review item with a compact, accessible collapsed summary.
- [x] 2.2 Render readable expanded details with origins, recommendation, review state, support, confidence, and evidence references while keeping evidence lazy until expansion.
- [x] 2.3 Move the complete candidate JSON, fingerprints, and full transport identifiers into a nested technical-details disclosure.
- [x] 2.4 Keep rationale and accept, reject, modify, and pin controls local to the expanded candidate, preserving read-only, pending, contract-error, revision-refresh, and mutation-error behavior.
- [x] 2.5 Add responsive styles for review-queue density, long-coordinate wrapping, distinct recommendation and review states, keyboard focus, and light/dark themes.

## 3. Decision History Navigation

- [x] 3.1 Place append-only decision history in an accessible disclosure that is collapsed by default.
- [x] 3.2 Connect each persisted candidate's latest-decision control to expansion and keyboard focus of the matching decision-history entry.
- [x] 3.3 Preserve complete decision history content and provide a graceful result when a referenced decision is not present in the loaded history response.

## 4. Workflow Verification

- [x] 4.1 Expand candidate fixtures to cover unreviewed, accepted, rejected, guided-without-support, low-support, renamed, relationship, and multi-evidence single-source cases.
- [x] 4.2 Update Candidates workflow tests for collapsed summaries, progressive disclosure, decision actions, technical details, contract errors, and latest-decision navigation.
- [x] 4.3 Verify candidate layout, wrapping, focus order, and decision flows at desktop and narrow widths in both light and dark themes.
- [x] 4.4 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`, and resolve any regressions within the change scope.
