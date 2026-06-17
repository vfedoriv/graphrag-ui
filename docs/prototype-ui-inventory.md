# Prototype UI Inventory

This maps reusable patterns from `new_ui_example` to the production React UI for `modernize-ui-from-prototype`.

## Shared Patterns

- Shell: `app-shell`, `sidebar`, `brand`, `nav-link`, and `workspace-switcher` map to `src/app/AppLayout.tsx`.
- Tokens: prototype color, typography, radius, spacing, border, status, output, table, form, tab, and responsive rules map to `src/index.css`.
- Controller sections: `page-header`, `workspace-strip`, `panel`, `panel-head`, and `ops-spine` map to `ControllerPage` plus `PrototypePrimitives`.
- Controls: `button`, `status`, `table-wrap`, `form-grid`, `field-label`, `file-picker`, `notice`, `output`, and `tab` map to shared UI primitives under `src/shared/ui`.

## Route Mapping

- `index.html` maps to `src/features/dashboard/DashboardPage.tsx` with live knowledge-base, schema, and document state.
- `knowledge-bases.html` maps to `src/features/knowledge-bases/KnowledgeBasesPage.tsx` with create, select, rename, and delete behavior preserved.
- `schemas.html` maps to `src/features/schemas/SchemasPage.tsx` with schema register actions and purpose workflow tabs preserved.
- `documents.html` maps to `src/features/documents/DocumentsPage.tsx` with upload, process, replace, delete, open, copy, and chunk inspection preserved.
- `queries.html` maps to `src/features/queries/QueriesPage.tsx` with Ask, Generate Cypher, Validate Cypher, Execute Cypher, and Hybrid Search tabs preserved.
- `settings.html` maps to `src/features/settings/SettingsPage.tsx` with runtime and proxy visibility only.
