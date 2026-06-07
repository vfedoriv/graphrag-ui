## Why

The current admin shell is centered with large unused gutters on wide viewports, which makes the navigation and controller content feel detached from the browser frame. The layout should behave more naturally as the browser width changes: navigation anchored to the left, content expanding into available space, and no excessive side gaps.

## What Changes

- Align the application shell to the left edge of the viewport instead of centering the full layout with a narrow maximum width.
- Keep the left navigation panel at a predictable fixed width across desktop viewports.
- Let the right-side application content flex to consume remaining horizontal space while maintaining readable internal spacing.
- Preserve responsive behavior on smaller viewports so content remains usable without horizontal page overflow.
- Keep existing navigation, active knowledge base selection, and controller page workflows unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-app-shell-and-navigation`: Updates layout requirements for sidebar anchoring, fixed navigation width, flexible main content width, and responsive viewport behavior.

## Impact

- Affects React app shell layout and related CSS in `src/app` and any shared layout primitives used by the shell.
- No backend API, DTO, routing, data-fetching, or dependency changes are expected.
- UI validation should include resizing the browser across desktop and smaller widths, with attention to page overflow and content readability.
