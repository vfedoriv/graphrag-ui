## Context

The app currently uses shared button styles but lacks clear visual feedback during hover and press interactions, so clicks can feel inert. Because buttons are used throughout all controller pages and shell actions, the fix must be centralized in shared UI button styling.

## Goals / Non-Goals

**Goals:**
- Add visible hover, focus-visible, and active/pressed states to shared buttons.
- Keep visual feedback consistent across default and variant button styles.
- Preserve accessibility and disabled-state clarity.

**Non-Goals:**
- Reworking page layouts or changing endpoint workflows.
- Introducing a new animation library.
- Changing backend behavior or request flow.

## Decisions

1. Implement interaction feedback in `src/shared/ui/Button.tsx` base class composition.
Rationale: one source of truth for all app buttons and minimal feature-page churn.
Alternative considered: per-feature button overrides; rejected due to inconsistency risk.

2. Use lightweight CSS states (`hover:`, `active:`, `focus-visible:`) with short transitions.
Rationale: responsive feel without performance overhead or motion complexity.
Alternative considered: JS-driven press animation; rejected as unnecessary for this scope.

3. Keep disabled buttons explicitly non-interactive with muted styles and no transform.
Rationale: prevents misleading feedback on unavailable actions.
Alternative considered: keep active transform on disabled; rejected for UX confusion.

## Risks / Trade-offs

- [Risk] State effects may conflict with existing variant background colors. -> Mitigation: keep effects subtle and test primary variants.
- [Risk] Overly strong active transforms can cause visual jitter in dense tables. -> Mitigation: use minimal translate/scale values.
- [Trade-off] Slightly more utility classes on button base style. -> Mitigation: centralize only in shared button component.

## Migration Plan

1. Update shared `Button` class names to include hover/focus/active transitions.
2. Verify interaction states on common button variants in key pages.
3. Add/update tests to ensure state-related classes are retained.
4. Run lint/build/tests and adjust as needed.

## Open Questions

- Should reduced-motion preferences further limit active-state transform in follow-up?
