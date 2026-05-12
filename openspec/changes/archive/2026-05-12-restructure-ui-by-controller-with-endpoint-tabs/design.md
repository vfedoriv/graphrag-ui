## Context

The admin UI already provides endpoint coverage for schemas, knowledge bases, documents, and queries, but workflows are split across mixed sections and uneven layouts. The target state is a controller-first IA: one page per controller with top-level list/context and endpoint actions grouped as tabs below it. This is a cross-feature frontend change affecting routing, feature page composition, and reusable UI primitives while keeping API contracts unchanged.

## Goals / Non-Goals

**Goals:**
- Provide one dedicated page per controller/domain.
- Keep each controller page's list/context section visible at the top.
- Move endpoint-specific operations into clearly named tabs on the same page.
- Standardize tab behavior and structure across multi-endpoint pages.
- Preserve existing API calls, request payloads, and mutation/query semantics.

**Non-Goals:**
- Changing backend endpoints, contracts, or controller semantics.
- Adding authentication/authorization features.
- Redesigning visual brand identity beyond structural/layout changes.

## Decisions

1. Introduce a reusable controller-page shell with two vertical regions: top summary/list region and tabbed endpoint-actions region.
Rationale: keeps controller pages consistent and lowers maintenance cost versus bespoke page layouts.
Alternative considered: implement bespoke tabs per feature page only; rejected due to inconsistent UX and duplicated layout logic.

2. Keep each endpoint workflow as an isolated component rendered inside a tab panel.
Rationale: minimizes regression risk by reusing existing forms/mutations and preserving local state boundaries.
Alternative considered: merge endpoint workflows into one mega-form; rejected because it couples unrelated endpoint actions and increases complexity.

3. Update routing/navigation labels to map directly to controllers rather than operation clusters.
Rationale: aligns page mental model with backend controller grouping requested by product.
Alternative considered: keep existing routes and add deep links only; rejected because it does not solve the top-level discoverability issue.

4. Adopt stable tab identifiers derived from endpoint intent (e.g., `create-schema`, `generate-yaml`).
Rationale: enables deterministic testing and future deep-linking without URL churn.
Alternative considered: index-based tabs; rejected due to fragility during reorder.

## Risks / Trade-offs

- [Risk] Large UI move may break existing tests/selectors. -> Mitigation: introduce stable `data-testid` values for controller containers and tab triggers.
- [Risk] Tab-local state resets when switching tabs. -> Mitigation: keep mounted tab panels where practical or preserve form defaults via React Hook Form state restoration.
- [Risk] Initial migration touches multiple features simultaneously. -> Mitigation: implement controller-by-controller with shared shell extracted first.
- [Trade-off] More explicit UI structure may add minor boilerplate per page. -> Mitigation: centralize shell and tab metadata helpers in shared UI layer.

## Migration Plan

1. Add shared controller-page shell and tab primitives.
2. Refactor Schemas page first (highest endpoint density) into top list + tabs.
3. Apply same pattern to Knowledge Bases, Documents, and Queries pages.
4. Update navigation and route declarations to controller-first naming.
5. Update/extend tests for tab rendering and endpoint workflow accessibility.
6. Run lint/build/tests and ship in one UI-only release.

Rollback: revert route/page composition changes and switch back to prior feature page components; backend is unaffected.

## Open Questions

- Should tab selection be URL-synced (`?tab=`) in this change or deferred to a follow-up?
- Should inactive tab panels remain mounted for all pages or only high-cost forms?
