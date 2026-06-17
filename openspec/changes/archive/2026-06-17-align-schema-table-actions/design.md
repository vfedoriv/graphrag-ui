## Context

The Schemas page renders a table with row actions for activation state, details, update, and delete. The current action group uses normal button intrinsic sizing, so `Activate` is wider than `Active`, and variant-specific styling can make `Delete` look different in height. Rows no longer line up cleanly in the actions column.

The app already has shared button primitives and table action styling used by other controller tables. This change should reuse or extend those local patterns rather than introduce a new design system layer.

## Goals / Non-Goals

**Goals:**

- Make Schemas list row action buttons align consistently across rows regardless of label length or button variant.
- Keep row action buttons visually consistent in height, including `Delete`.
- Keep the visible action order and existing activation/detail/update/delete behavior unchanged.
- Preserve row pending, disabled, danger, and ghost button states.
- Keep the table horizontally scrollable without page-level overflow on narrow viewports.

**Non-Goals:**

- Changing schema API contracts or mutation behavior.
- Redesigning the full Schemas page layout.
- Replacing button text with icons or changing action labels.
- Creating a new global table abstraction unless existing primitives cannot express the fix.

## Decisions

1. Use stable action slots or equalized action button dimensions in the Schemas table.

   Each row should reserve the same horizontal space and height for the activation, details, update, and delete controls. This can be done by applying a row-action container plus a schema-specific action button class or by extending the existing table action button style with dimensions that cover the longest expected label and normalize variant height.

   Alternative considered: rely on `justify-content` or spacing changes in the toolbar. That does not fix intrinsic-width drift because the left edge of later buttons still depends on previous label widths.

2. Keep text labels and existing button variants.

   Text labels remain clear and accessible, while consistent widths solve the visual defect. Existing `ghost`, `danger`, disabled, and pending states continue to communicate semantics.

   Alternative considered: use icons to make every action the same width. That would be a larger UX change and would require additional tooltip/accessibility work.

3. Scope styling to table row actions.

   The fix should avoid changing all toolbar buttons across the app. Shared styles can be reused, but any wider minimum width required for schema row actions should be scoped to the Schemas table action group or a reusable table-action class.

## Risks / Trade-offs

- Wider action buttons may increase table minimum width -> Keep the layout inside the existing scrollable table wrapper and avoid page-level overflow.
- Equalized heights may override subtle variant differences -> Preserve semantic color/border differences while normalizing dimensions.
- Pending text such as `Activating...` or `Deleting...` may exceed the stable width -> Allow the button to grow or choose a width that keeps pending states readable.
- Existing tests may not cover visual alignment -> Add a targeted class/rendering assertion and rely on existing workflow tests for behavior preservation.
