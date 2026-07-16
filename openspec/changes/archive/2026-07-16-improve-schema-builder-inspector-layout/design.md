## Context

The Schema Builder renders its visual canvas and a metadata/element inspector as a two-column CSS grid on wide screens. The grid row height is determined by the taller column, so a relationship with many properties makes the sidebar determine the height of the entire Visual Builder section even though the canvas column has finished. This creates a large blank area below the canvas and delays access to the Raw JSON contract. Inspector textareas also inherit the application's global `min-height: 128px`, and every property field currently occupies its own row. React Flow's built-in controls retain library-default colors that are not aligned with the application's dark theme tokens.

The change must remain frontend-only, preserve the visual/raw JSON synchronization contract, use existing shared primitives and theme tokens, and behave responsively without trapping mobile users in nested scroll regions.

## Goals / Non-Goals

**Goals:**

- Keep the Visual Builder section close to the height of its canvas/actions column even when the selected element has many properties.
- Provide an obvious, keyboard-operable vertical scroll region for overflowing desktop inspector content.
- Increase inspector information density without making field labels, values, or destructive actions ambiguous.
- Make React Flow control buttons legible and visibly interactive in both light and dark themes.
- Preserve usable document flow at narrow viewport widths.

**Non-Goals:**

- Changing schema DTOs, serialization, validation, API calls, or backend contracts.
- Redesigning the graph canvas, minimap, relationship routing, or selection model.
- Making the metadata card or runtime context sticky inside the inspector.
- Introducing a new UI library or replacing React Flow controls.

## Decisions

### Bound and scroll the wide-screen sidebar as one region

At the existing two-column breakpoint, the sidebar will receive a viewport-aware maximum block size and `overflow-y: auto`, with sufficient scrollbar gutter and focus visibility. Bounding the whole sidebar ensures any combination of metadata, selected-element fields, property rows, and runtime context cannot expand the parent grid indefinitely. The main column remains naturally sized by its toolbar, canvas, actions, and feedback, so the Raw JSON section follows the useful visual content rather than the inspector's full content height.

On the single-column responsive layout, the maximum height and internal scrolling will be removed so touch and small-screen users retain ordinary page scrolling. A permanently fixed sidebar height was rejected because it would waste space on taller displays and create an unnecessary scroll area for short inspectors. Scrolling only the property list was rejected because relationship identity and endpoint fields could become separated from their properties and multiple nested scroll regions would be harder to understand.

### Scope density changes to Schema Builder inspector content

Schema Builder metadata and element description textareas will use a compact, builder-specific minimum height rather than changing the shared textarea baseline. Inspector/card gaps and property-row spacing will be reduced within the sidebar. Property controls will use a compact grid at sidebar widths that can accommodate paired controls, while retaining a single-column fallback when space is constrained. Labels, accessible names, the Required checkbox, and the Remove action remain explicit.

This scoped approach avoids changing textarea and form density across unrelated controller pages. Hiding property fields behind accordions or pagination was rejected because it would slow comparison and editing of a moderate number of properties.

### Theme React Flow controls with application tokens

Styles scoped beneath `.schema-builder-canvas` will set control button background, foreground/icon color, border, hover/active treatment, and keyboard focus using existing theme variables. Disabled states will remain distinguishable, and control hit areas will not be reduced. Scoping prevents overrides from affecting React Flow instances outside the Schema Builder.

Replacing the built-in controls with custom buttons was rejected because the current controls already provide the required zoom, fit, and interactivity behavior and accessible labeling.

### Verify semantics in component tests and layout visually

Component tests will cover the inspector's structural classes/regions and continued availability of property controls with a long property set. Since jsdom does not perform CSS layout or accurately validate contrast and overflow, desktop/mobile overflow behavior and both themes will also be checked through the project's browser-level workflow or an explicit visual verification step.

## Risks / Trade-offs

- [A viewport-aware sidebar height may be too short on low-height desktop windows] → Use a practical minimum tied to the canvas area, retain ordinary page scrolling, and verify a short desktop viewport.
- [Nested scrolling can make wheel or keyboard navigation less obvious] → Limit it to the wide two-column layout, use visible overflow affordances, and keep the entire inspector as one scroll region.
- [Denser property rows may become cramped with long names or localized labels] → Use flexible `minmax(0, …)` columns, allow controls to shrink correctly, and fall back to one column at narrow widths.
- [React Flow selector changes could make theme overrides stale after a dependency update] → Scope overrides to stable public React Flow class names and cover the rendered controls in focused UI tests.
