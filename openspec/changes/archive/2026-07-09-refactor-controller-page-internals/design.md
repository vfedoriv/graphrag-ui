## Context

The app already follows a feature-oriented structure and has useful shared UI primitives. The main maintainability issue is file-level concentration: several page components are responsible for too many concerns at once. The safest refactor path is feature-local extraction rather than introducing a broad architecture rewrite.

## Goals / Non-Goals

**Goals:**
- Reduce page-component complexity by extracting cohesive feature-local hooks/components.
- Preserve current user-visible workflows and backend contracts.
- Keep server state in existing TanStack Query API modules.
- Improve focused testability of workflow state, parsing, and derived values.

**Non-Goals:**
- No UI redesign.
- No global state library.
- No backend DTO or endpoint changes.
- No broad shared abstraction unless duplication is proven after feature-local extraction.

## Decisions

- Extract within feature folders first.
  - Rationale: Documents, Schemas, Settings, and Schema Builder have different workflow models, so feature-local modules preserve context and reduce accidental coupling.
  - Alternative: create generic workflow abstractions immediately; rejected because it risks abstracting unrelated page behavior.

- Keep API modules as the server-state boundary during this refactor.
  - Rationale: the current typed API and query-key pattern is already working and tested.
  - Alternative: move mutation orchestration into page-only utilities without hooks; rejected because it would weaken the existing state ownership model.

- Refactor one page at a time with tests kept green between slices.
  - Rationale: these pages contain many workflows and a broad refactor would make regressions hard to localize.

## Risks / Trade-offs

- Moving JSX can break tests that depend on text hierarchy -> update tests only where behavior-preserving markup changes require it.
- Extracted hooks can become dumping grounds -> each hook should own one workflow concern such as document actions, schema row actions, runtime setting drafts, or builder draft synchronization.
- Refactor-only changes can hide accidental behavior changes -> use existing workflow tests and Playwright coverage as acceptance gates.
