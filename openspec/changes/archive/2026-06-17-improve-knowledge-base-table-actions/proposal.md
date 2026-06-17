## Why

The Knowledge Bases table currently mixes inline editing controls into the name column, has inconsistent row action sizing, deletes knowledge bases without a confirmation step, and includes unclear page description copy. These issues make a destructive management page feel less deliberate than it should, especially because deleting a knowledge base removes all data associated with it.

## What Changes

- Replace inline name editing in the table with a dedicated edit/update action so the name column remains read-only until the user explicitly chooses to edit.
- Normalize row action button sizing so table actions are visually consistent.
- Add a confirmation dialog before deleting a knowledge base, with warning copy that all data related to the knowledge base will be deleted.
- Remove the unclear sentence "Mutations update the visible list and keep selection state honest." from the Knowledge Bases page description.
- Preserve existing create, select, update, delete, pending, error, and selection reconciliation behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `knowledge-base-management`: Require explicit edit/update affordances for row renames, consistent table action sizing, confirmation before destructive delete, and clear user-facing copy.

## Impact

- Affected UI: `src/features/knowledge-bases/KnowledgeBasesPage.tsx`
- Affected tests: `src/features/knowledge-bases/KnowledgeBasesPage.test.tsx`
- Affected specs: `openspec/specs/knowledge-base-management/spec.md`
- API contracts: no backend API changes expected
- Dependencies: no new runtime dependencies expected
