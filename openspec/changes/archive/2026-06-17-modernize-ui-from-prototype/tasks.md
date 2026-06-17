## 1. Prototype Audit and Token Setup

- [x] 1.1 Inventory reusable visual patterns from `new_ui_example/index.html`, route HTML files, `styles.css`, and `app.js` and map them to existing React routes/components.
- [x] 1.2 Add or update global CSS tokens for prototype colors, font stacks, radii, spacing, borders, focus outlines, and output surfaces.
- [x] 1.3 Ensure IBM Plex Sans, system UI, and JetBrains Mono font stacks are configured with acceptable fallbacks and no blocking external dependency.
- [x] 1.4 Replace legacy global theme values that conflict with the prototype while preserving app-wide accessibility and readable contrast.

## 2. Shared UI Primitives

- [x] 2.1 Update shared Button styling for prototype standard, primary, danger, ghost, disabled, active, focus-visible, and pending states.
- [x] 2.2 Update shared panel/page header/status/table/form/tab/output primitives to match prototype classes and behavior.
- [x] 2.3 Add reusable operation spine, workspace strip, action grid, notice, file picker, and compact metric primitives where existing components do not cover the prototype patterns.
- [x] 2.4 Verify JSON/schema editors, textareas, code outputs, and table wrappers shrink correctly inside panels without page-level overflow.

## 3. App Shell and Global Context

- [x] 3.1 Rework the app shell to use the prototype two-column desktop layout with a fixed-width left sidebar and flexible workspace content.
- [x] 3.2 Update brand, route navigation, active route styling, sidebar spacing, and responsive stacked navigation under the tablet breakpoint.
- [x] 3.3 Rework the global knowledge-base selector/context display to match the prototype workspace switcher while using real selected knowledge-base state.
- [x] 3.4 Preserve persisted knowledge-base selection reconciliation and controller workflow scoping after shell changes.

## 4. Route Modernization

- [x] 4.1 Modernize the Dashboard route from `new_ui_example/index.html`, replacing sample workspace metrics with live or derived app state.
- [x] 4.2 Modernize the Knowledge Bases route from `new_ui_example/knowledge-bases.html`, preserving create, select, update, delete, loading, empty, and error behavior.
- [x] 4.3 Modernize the Schemas route from `new_ui_example/schemas.html`, preserving the schema register, purpose workflow tabs, editable drafts, activation, update, delete, detail retrieval, validation, and creation behavior.
- [x] 4.4 Modernize the Documents route from `new_ui_example/documents.html`, preserving upload, processing, replace/delete/open actions, chunk inspection, request progress, and empty/error states.
- [x] 4.5 Modernize the Queries route from `new_ui_example/queries.html`, preserving Ask, Generate Cypher, Validate Cypher, Execute Cypher, and Hybrid Search workflows.
- [x] 4.6 Modernize the Settings route from `new_ui_example/settings.html`, preserving runtime/proxy visibility and real configuration assumptions without adding fake security controls.

## 5. Interaction and Accessibility

- [x] 5.1 Preserve accessible route navigation, tab roles, aria-selected state, form labels, table labels, button labels, and keyboard focus order after visual updates.
- [x] 5.2 Ensure all async actions expose visible pending state and prevent duplicate activation while requests are in flight.
- [x] 5.3 Ensure success, warning, danger, neutral, loading, empty, and error states use the prototype status and notice language consistently.
- [x] 5.4 Replace prototype-only static messages with real API response, ProblemDetail, validation, or empty-state feedback.

## 6. Tests and Validation

- [x] 6.1 Update affected React Testing Library tests for shell structure, route headings, workflow tabs, row actions, pending states, and accessible labels.
- [x] 6.2 Add focused tests for shared primitives where visual-state class/attribute behavior changed materially.
- [x] 6.3 Run `npm run lint` and fix reported issues.
- [x] 6.4 Run `npm run test:run` and fix regressions.
- [x] 6.5 Run `npm run build` and fix type or bundling issues.
- [x] 6.6 Run browser viewport checks for 360x800, 390x844, 430x932, 600x960, 820x1180, 1024x768, 1366x768, 1440x900, and 1920x1080 with no horizontal page overflow.
- [x] 6.7 Capture or review screenshots for the redesigned routes and compare against the matching prototype screens before marking the change complete.
