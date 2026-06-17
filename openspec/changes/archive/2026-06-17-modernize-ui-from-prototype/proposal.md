## Why

The current GraphRAG UI works functionally, but it does not match the more polished, controller-oriented prototype in `new_ui_example`. Updating the production UI to follow that prototype gives users a more modern, professional admin experience while preserving the existing backend contracts and workflows.

## What Changes

- Apply the `new_ui_example` visual system across the React app as closely as production constraints allow, including OKLCH color tokens, IBM Plex/JetBrains Mono typography, compact spacing, 8-10px radii, restrained borders, status pills, tables, panels, and output surfaces.
- Rework the app shell to match the prototype's left sidebar, brand mark, controller navigation, global workspace/knowledge-base selector, and responsive single-column behavior below the tablet breakpoint.
- Modernize Dashboard, Knowledge Bases, Schemas, Documents, Queries, and Settings routes using the corresponding prototype HTML files as page-level references.
- Preserve the app's real data flows, same-origin `/api` usage, TanStack Query state, ProblemDetail error handling, and current backend DTO contracts.
- Replace prototype-only static sample content with real API-backed data or existing functional equivalents.
- Preserve and extend interactive states from the prototype: hover, focus-visible, active, disabled, loading, empty, error, and success states.
- Validate the redesign across the prototype viewport matrix, with special attention to no horizontal page overflow on mobile/tablet.

## Capabilities

### New Capabilities

- `prototype-aligned-ui-design-system`: Shared visual design system, component styling, page layout, and responsive behavior derived from `new_ui_example`.

### Modified Capabilities

- `admin-app-shell-and-navigation`: The shell navigation, brand treatment, global knowledge-base selector, desktop sidebar layout, and mobile responsive layout will be updated to match the prototype.
- `controller-page-tabbed-endpoint-workflows`: Controller pages will retain their current workflow behavior but adopt the prototype's page structure, panel hierarchy, tabs, form layout, and output presentation.
- `interactive-button-state-feedback`: Shared buttons and action controls will use the prototype's hover, focus-visible, active, disabled, and pending visual language.

## Impact

- Affected UI code under `src/app`, `src/features/dashboard`, `src/features/knowledge-bases`, `src/features/schemas`, `src/features/documents`, `src/features/queries`, `src/features/settings`, and `src/shared/ui`.
- Affected global styling and token definitions, including fonts, color variables, table styles, form controls, panels, status pills, and responsive breakpoints.
- Affected tests and snapshots/assertions that depend on shell layout, labels, page structure, tab presentation, or button state styling.
- No backend API contract changes, authentication changes, deployment configuration changes, or required new backend services.
