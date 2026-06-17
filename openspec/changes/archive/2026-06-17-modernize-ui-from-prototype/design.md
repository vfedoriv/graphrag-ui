## Context

The repository is a React 19 + Vite + TypeScript frontend for the GraphRAG backend. It already implements the core controller workflows for dashboard navigation, knowledge-base selection and CRUD, schema management, document ingestion, query execution, and settings visibility. The redesign request is visual and interaction-focused: production behavior should remain backed by existing `/api/v1` contracts while the UI is updated to match the exported prototype in `new_ui_example`.

The prototype provides six screen files: `index.html`, `knowledge-bases.html`, `schemas.html`, `documents.html`, `queries.html`, and `settings.html`. Its CSS defines the visual source of truth: a light OKLCH palette, IBM Plex Sans display typography, system body typography, JetBrains Mono monospace surfaces, compact 8-10px radii, bordered panels, fixed desktop sidebar, status pills, table wrappers, action grids, tab pills, dark code/output blocks, and a responsive breakpoint at 820px.

## Goals / Non-Goals

**Goals:**

- Match the prototype's visual system, typography, color tokens, spacing rhythm, border treatment, panel hierarchy, and responsive behavior as closely as practical in the existing React app.
- Preserve the existing route boundaries for Dashboard, Knowledge Bases, Schemas, Documents, Queries, and Settings while using each matching prototype HTML file as the page-level visual reference.
- Keep the backend contract unchanged, including same-origin `/api` traffic, existing DTOs, TanStack Query hooks, mutation invalidation, and ProblemDetail error normalization.
- Replace prototype sample data with live API-backed data, current application state, or existing empty/error/loading states.
- Preserve accessibility semantics for route navigation, tabs, forms, tables, buttons, status text, focus states, and disabled states.
- Validate the redesign against the prototype viewport matrix with no horizontal page overflow.

**Non-Goals:**

- No backend API changes.
- No authentication, authorization, role model, or new security UI.
- No replacement of React, Vite, React Router, TanStack Query, or the current API client.
- No landing page, marketing page, OS widget, or prototype launcher route beyond the existing admin dashboard.
- No fake data layer for production behavior; static prototype content may only be used as layout guidance or test fixture copy where the app has no live equivalent.

## Decisions

1. Port the prototype as a shared CSS token/component layer before page-by-page changes.

   The prototype is strongest as a visual system: variables, shell layout, panel primitives, table wrappers, status pills, form grids, tabs, outputs, and responsive rules. Implementing those shared primitives first keeps pages consistent and prevents each feature from approximating the design independently.

   Alternative considered: copy prototype CSS into each route. That would be faster initially but would duplicate styling, make later fixes harder, and drift from the existing shared primitive model in `src/shared/ui`.

2. Keep React feature boundaries and route ownership intact.

   Each prototype screen maps naturally to an existing route. The implementation should update `src/app` and feature pages in place instead of introducing a parallel static prototype layer. Existing page data ownership remains with the feature modules, and shared UI primitives continue to live under `src/shared/ui`.

   Alternative considered: serve the prototype HTML directly and gradually reconnect actions. That would bypass existing state management, tests, routing, and backend integration, creating a second app inside the repo.

3. Treat `new_ui_example/styles.css` as the source of truth for tokens.

   The production theme should use the prototype's variables and values where browser/tooling support allows: `--bg`, `--surface`, `--surface-2`, `--fg`, `--muted`, `--border`, `--accent`, `--success`, `--warn`, `--danger`, display/body/mono font stacks, 260px desktop sidebar, 28px workspace padding, 18px panel padding, 8-10px radii, and the 820px responsive breakpoint.

   Alternative considered: translate the prototype into a different Tailwind-only palette. That risks losing fidelity and creating a generic framework look instead of the requested precise design.

4. Use real app state for workspace and controller content.

   The prototype's `WORKSPACES` object demonstrates selection behavior and context propagation. Production should map that concept to the existing selected knowledge-base state and server-backed data, including selected KB metadata, active schema, document counts where available, and mutation/loading/error states.

   Alternative considered: hard-code the prototype workspaces as defaults. That would look accurate but would be misleading in production and conflict with the frontend-only API consumer role.

5. Preserve workflow semantics while modernizing layout.

   Documents should remain inline/action-driven, Schemas should remain purpose-tabbed, and Queries should keep endpoint tabs including hybrid search. The redesign changes visual hierarchy and interaction polish, not the backend workflow contract.

   Alternative considered: force every route into the exact static prototype structure regardless of current workflow. That could remove existing capabilities or hide current states that users rely on.

6. Validate with browser screenshots rather than only unit tests.

   The change is primarily visual and responsive, so implementation should include Playwright screenshot/viewport checks for desktop, tablet, and mobile in addition to lint, unit tests, and build. The key acceptance condition is no broken layout or horizontal overflow while preserving live workflows.

   Alternative considered: rely on component/unit tests only. Those tests catch behavior regressions but do not prove design fidelity or responsive layout quality.

## Risks / Trade-offs

- [Risk] Prototype CSS uses OKLCH and `color-mix`, which may expose browser support or test-environment differences. -> Keep values in CSS where supported by the target browser stack and add fallback-safe usage only if tests or runtime validation show problems.
- [Risk] A precise redesign can break tests that query by old layout structure or text. -> Update tests to assert durable accessible labels, workflow behavior, and visible states rather than implementation-specific containers.
- [Risk] Live backend data may not provide every prototype metric, such as exact document totals on every screen. -> Show real available data first and use neutral empty/loading labels where a value is unavailable.
- [Risk] Global style changes can unintentionally affect JSON editors, tables, and dense forms. -> Validate high-risk screens manually and with targeted tests for schema editors, document chunk output, and query result output.
- [Risk] Font availability may differ between developer machines and production. -> Use the prototype font stacks with system fallbacks and avoid relying on exact external font loading unless assets are explicitly added.
