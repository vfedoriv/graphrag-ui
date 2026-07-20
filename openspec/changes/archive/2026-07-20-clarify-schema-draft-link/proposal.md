## Why

Draft targets in the Schema Drafts table navigate to a draft workbench, but their current plain-text appearance does not communicate that they are interactive. Users should be able to recognize the navigation action before clicking and when navigating by keyboard.

## What Changes

- Present each draft target name and version with an explicit, consistent link treatment in the drafts table.
- Preserve navigation to the existing draft detail route while adding clear default, hover, and keyboard-focus affordances.
- Add focused UI coverage for the link's destination and affordance styling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-management-ui`: Require listed draft targets to be visibly identifiable as links that open their draft workbench.

## Impact

- Affects the Schema Drafts list rendering, shared or feature-scoped link styling, and the Schema Drafts page tests.
- Does not change backend APIs, DTOs, routing structure, dependencies, or draft lifecycle behavior.
