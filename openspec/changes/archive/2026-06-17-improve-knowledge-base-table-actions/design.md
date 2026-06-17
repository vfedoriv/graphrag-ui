## Context

The Knowledge Bases page is a controller-style management page for creating, selecting, renaming, and deleting knowledge bases. The current table renders an editable input directly in the `Name` column, exposes delete as an immediate action, and uses row actions whose visual sizes can diverge. The page also includes copy that describes internal mutation behavior rather than user-facing value.

This change stays within the frontend. It uses the existing knowledge base API mutations and shared UI primitives.

## Goals / Non-Goals

**Goals:**

- Keep the `Name` column readable by default and expose renaming through an explicit row edit/update action.
- Make row actions visually consistent in size and spacing.
- Require confirmation before deleting a knowledge base, with clear warning copy that all related data will be deleted.
- Remove unclear implementation-oriented copy from the page description.
- Preserve existing mutation behavior, pending state, error alerts, and selected knowledge base reconciliation.

**Non-Goals:**

- Changing backend knowledge base API contracts.
- Adding bulk edit/delete behavior.
- Adding a new modal library or global dialog system unless an existing shared pattern already supports it.
- Changing create form behavior beyond any layout adjustments needed for consistency.

## Decisions

1. Use explicit row edit mode for renames.

   The table should render the knowledge base name as text until the user chooses an Edit action. Editing should then expose a focused input plus Save/Cancel controls for that row. This avoids accidental update attempts from casual table scanning and makes rename intent clear.

   Alternative considered: keep inline inputs and add an Update button. That still leaves editable controls in every row and does not address the concern that the `Name` column should not behave like a form by default.

2. Keep delete confirmation local to the Knowledge Bases page.

   A browser confirmation dialog or existing lightweight shared confirmation pattern is sufficient for this targeted change. The confirmation copy must name the destructive scope: deleting a knowledge base deletes all related data.

   Alternative considered: build a new shared modal component. That is unnecessary unless multiple pages need the same richer confirmation behavior.

3. Normalize row actions through shared button sizing/classes.

   The implementation should use the existing `Button` primitive and stable table action layout classes so Use/Current, Edit/Save/Cancel, and Delete controls align visually and do not resize rows unpredictably.

   Alternative considered: per-button custom CSS. That would solve the immediate mismatch but increase local styling drift.

## Risks / Trade-offs

- Existing tests assume the name column always contains an input -> Update tests to interact with the explicit Edit flow.
- Confirmation can make tests more verbose -> Add direct coverage for confirm and cancel paths so destructive behavior remains intentional.
- Browser-native confirmation copy is harder to style -> Acceptable for this targeted safety fix unless a shared modal already exists.
