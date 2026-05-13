## Why

Code review identified a correctness risk where table rows are keyed by array index while the Knowledge Bases name editor uses uncontrolled inputs. After row deletion or reorder, React can reuse DOM nodes and display stale names in surviving rows, creating a data-integrity hazard in inline editing.

## What Changes

- Add stable row identity support to the shared table so rows can be keyed by domain identifiers instead of positional index.
- Update Knowledge Bases list rendering to pass stable row keys derived from knowledge base IDs.
- Tighten inline name editing behavior so update requests only fire when the value actually changed.
- Ensure inline editing remains consistent with server state after mutation success/failure and row list updates.
- Add regression tests for row identity and inline edit behavior during delete/update workflows.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `knowledge-base-management`: require stable row identity and safe inline editing behavior to prevent stale field reuse after list mutations.

## Impact

- Affected code: `src/shared/ui/Table.tsx`, `src/features/knowledge-bases/KnowledgeBasesPage.tsx`, and related tests.
- No backend API or contract changes.
- Reduces risk of user-visible stale values and unintended updates after delete/reorder events.
