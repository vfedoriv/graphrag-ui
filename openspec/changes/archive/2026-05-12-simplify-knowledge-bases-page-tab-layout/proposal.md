## Why

The current Knowledge Bases page has multiple tabs that only describe actions rather than providing meaningful separate workflows, which adds unnecessary navigation overhead. We need to simplify this page so create is directly visible and update/delete/select remain in the table actions where users already perform them.

## What Changes

- Remove `Update knowledge base`, `Delete knowledge base`, and `Select active knowledge base` tabs from the Knowledge Bases page.
- Remove `Create knowledge base` as a tab and render the create form as a direct, always-visible part of the page layout.
- Keep update/delete/select behavior in the table action controls unchanged.
- Preserve controller-page layout consistency while allowing this page to use no endpoint tabs.

## Capabilities

### New Capabilities
- `controller-page-without-endpoint-tabs`: Allow controller pages with simple workflows to render without endpoint tabs when tabs do not add value.

### Modified Capabilities
- `knowledge-base-management`: Knowledge base create/update/delete/select interactions are consolidated into direct page sections and table actions without separate endpoint guidance tabs.
- `controller-page-tabbed-endpoint-workflows`: Clarify that tabs are optional for controllers whose workflows are better represented inline.

## Impact

- Affected frontend areas: `src/features/knowledge-bases/KnowledgeBasesPage.tsx` and potentially shared controller page composition behavior.
- UI tests for Knowledge Bases tabs must be updated to reflect removed tabs and inline create form.
- No backend API contract changes.
