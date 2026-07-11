## Why

The UI currently provides only a light appearance, which can be uncomfortable in low-light environments and does not honor users who prefer a dark system theme. Adding a persistent appearance preference makes the admin UI more comfortable and accessible without changing backend behavior.

## What Changes

- Add light, dark, and system appearance choices, with system selected by default for users who have not made an explicit choice.
- Apply the selected or system-resolved theme across the entire application using semantic design tokens.
- Provide an accessible theme control in the application shell.
- Persist an explicit appearance choice locally and restore it before the application renders to avoid a theme flash.
- React to operating-system color-scheme changes while the system option is selected.
- Add automated coverage for selection, persistence, system preference handling, and representative shared UI states in both themes.

## Capabilities

### New Capabilities
- `appearance-theme-management`: User-facing theme selection, system preference resolution, persistence, and application-wide theme application.

### Modified Capabilities
- `admin-app-shell-and-navigation`: Add an accessible appearance control to the shared application shell.
- `prototype-aligned-ui-design-system`: Require shared semantic colors and interactive states to render legibly in light and dark themes.

## Impact

- Affects the app bootstrap, shared state, application shell, global CSS tokens, and shared UI primitives.
- Adds browser integration with `localStorage` and `matchMedia`; no backend API or deployment contract changes.
- Requires unit/component tests and visual verification of the major controller pages in both themes.
