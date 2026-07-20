## Context

The Schema Drafts list already renders each target with React Router's `Link` and routes to `/schema-drafts/:draftId`. The global anchor reset removes color and underlining, so the target is visually indistinguishable from non-interactive table text in its resting state. The change should fit the existing dark/light themes and remain understandable without relying on color alone.

## Goals / Non-Goals

**Goals:**

- Make draft-target navigation recognizable before interaction.
- Retain native link semantics, keyboard navigation, and the existing client-side destination.
- Provide clear hover and `:focus-visible` feedback using existing design tokens.
- Cover both the destination and the intentional visual hook with a focused component test.

**Non-Goals:**

- Making the entire table row clickable.
- Changing the table structure, draft workbench route, or backend API.
- Introducing a new generic navigation component or design-system dependency.

## Decisions

1. Apply a feature-specific class to the existing `Link`. Style it with an always-visible non-color cue, an accent treatment consistent with interactive controls, and distinct hover and `:focus-visible` states. This is preferred to changing the global `a` reset, which could alter navigation and card links throughout the application.

2. Keep the target text as the link's accessible name and optionally pair it with a small decorative directional icon. The persistent text treatment is the primary affordance; an icon must be hidden from assistive technology so it does not make the accessible name noisy.

3. Keep only the target cell interactive rather than making the row clickable. A native anchor exposes the correct semantics, supports expected browser interactions, and avoids conflicting click targets if row actions are added later.

4. Add a Schema Drafts page test that finds the target by link role, verifies its `/schema-drafts/:draftId` destination, and asserts the feature class used for the visible treatment. CSS pseudo-state behavior remains a styling responsibility because jsdom does not visually render hover and focus.

## Risks / Trade-offs

- [The link style may be too subtle in one theme] → Use theme tokens and a persistent shape or decoration in addition to color, then verify both theme variants during implementation.
- [A feature-specific style duplicates future table-link patterns] → Keep the selector narrowly named now; promote it to a shared primitive only when another concrete consumer establishes a reusable pattern.
- [An icon can crowd narrow tables] → Keep it compact and decorative, while preserving the existing table's horizontal overflow behavior.
