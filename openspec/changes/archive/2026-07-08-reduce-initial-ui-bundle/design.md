## Context

The router imports every page eagerly, so the dashboard bundle includes heavy feature code that is not needed for the first route. The build currently reports a minified JavaScript chunk larger than Vite's default warning threshold.

## Goals / Non-Goals

**Goals:**
- Split route modules so each major page can load on demand.
- Preserve current URL paths, global knowledge-base selection, and app-shell navigation.
- Provide a simple route loading fallback that fits the existing controller UI.
- Remove the oversized initial chunk warning from the production build.

**Non-Goals:**
- No route restructuring or URL changes.
- No redesign of page content.
- No dependency replacement for Schema Builder or JSON editors.

## Decisions

- Use React route-level lazy loading rather than manual bundler output configuration first.
  - Rationale: the current pressure comes from eager page imports, and route-level splitting addresses that with minimal application risk.
  - Alternative: tune `build.rollupOptions` or chunk warning limits; rejected as the first move because it can hide the initial-load issue.

- Keep the app shell eagerly loaded and lazy-load only route content.
  - Rationale: navigation and global workspace context should remain stable while page content loads.
  - Alternative: lazy-load the whole app shell; rejected because it would delay the main navigation surface.

- Use existing UI primitives for the fallback.
  - Rationale: a simple loading message or progress banner is enough and avoids introducing a new loading design system.

## Risks / Trade-offs

- Lazy loading can change test timing -> browser and app tests should wait for route headings/content through Playwright/RTL assertions.
- Chunk names and sizes can vary by Vite/Rolldown output -> acceptance should focus on no oversized initial chunk warning and route behavior, not exact filenames.
- A route loading fallback can flash on fast local machines -> keep it minimal and non-disruptive.
