## 1. Diff Review Component

- [x] 1.1 Extract the loaded Diff presentation into a feature-local review component while preserving the page's existing query, no-aggregate, loading, and error behavior.
- [x] 1.2 Add derived total and compatibility counts, readable compatibility and operation labels, client-side compatibility/operation filtering, visible-result feedback, and clear-filter behavior without reordering response items.
- [x] 1.3 Implement compact native disclosure rows with separate coordinate, operation, and compatibility signals and lazily mount expanded payload content.
- [x] 1.4 Build exact before/after comparison panels that clearly handle null or absent states and structured values.

## 2. Visual and Responsive Treatment

- [x] 2.1 Add feature-specific review queue, summary, badge, focus-visible, comparison panel, and overflow styles using existing semantic theme tokens.
- [x] 2.2 Add narrow-screen rules that stack toolbar controls and comparison panels while allowing long coordinates and payload values to wrap or scroll without clipping.
- [x] 2.3 Verify the Diff section visually in light and dark themes at desktop and narrow viewport sizes, including collapsed, expanded, filtered, and focused states.

## 3. Automated Verification

- [x] 3.1 Add component tests for risk and result counts, readable summary labels, default lazy disclosure, keyboard-toggleable expansion, exact before/after values, and null-state messaging.
- [x] 3.2 Add component tests for combined filtering, preserved result order, clear-filter behavior, and the no-matching-changes state.
- [x] 3.3 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`, and resolve regressions introduced by the Diff redesign.
