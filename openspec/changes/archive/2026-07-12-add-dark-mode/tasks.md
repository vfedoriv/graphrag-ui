## 1. Theme foundation

- [x] 1.1 Add typed appearance preference, effective-theme resolution, guarded storage helpers, and media-query handling in shared theme state
- [x] 1.2 Add pre-render theme initialization that uses the same storage key and resolution rules, marks the document root, and sets browser color scheme
- [x] 1.3 Register the theme provider in the application provider tree and expose a focused hook for shell consumers

## 2. Theme-aware visual system

- [x] 2.1 Define complete light and dark semantic token palettes in the global stylesheet, including controls, interactive states, focus, status, and output roles
- [x] 2.2 Audit global and feature styling for literal or light-biased colors and migrate them to semantic tokens
- [x] 2.3 Verify shared primitives, controller panels, tables, editors, notices, badges, and output previews remain legible and distinguishable in both themes

## 3. Appearance control

- [x] 3.1 Add a labeled Light/System/Dark control to the shared application shell using the shared theme hook
- [x] 3.2 Style keyboard focus, selection, hover, pressed, disabled, and narrow-viewport behavior with theme-aware tokens
- [x] 3.3 Confirm changing appearance preserves routing, selected knowledge-base context, and responsive shell layout

## 4. Automated validation

- [x] 4.1 Add unit tests for default resolution, valid and invalid persistence, storage failures, explicit selection, and system preference changes
- [x] 4.2 Add application-shell component tests for accessible appearance selection, document theme updates, and selected knowledge-base preservation
- [x] 4.3 Add representative light/dark rendering tests for shared interactive states and run lint, unit tests, coverage, and production build
