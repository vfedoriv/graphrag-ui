## Context

Knowledge Bases currently uses four tabs, but three of them are informational placeholders while real operations already happen via table actions. This creates extra clicks and duplicates guidance text without improving action execution.

## Goals / Non-Goals

**Goals:**
- Make create workflow directly visible on page load.
- Remove low-value tabs that duplicate existing table action affordances.
- Preserve all existing CRUD/select behavior.

**Non-Goals:**
- Redesigning the entire controller page system.
- Changing backend endpoints or data contracts.
- Altering schemas/documents/queries page tab structures.

## Decisions

1. Render create form inline on Knowledge Bases page instead of inside tabs.
Rationale: create is a primary action and should be immediately discoverable.
Alternative considered: keep single create tab; rejected as unnecessary indirection.

2. Remove update/delete/select tabs entirely and rely on row actions.
Rationale: operations are already attached to relevant table rows.
Alternative considered: keep guidance tabs; rejected due to redundancy.

3. Keep controller page shell but allow `tabs` content to be optional for this page.
Rationale: maintains visual consistency while reducing complexity.
Alternative considered: special-case page outside shell; rejected due to inconsistency.

## Risks / Trade-offs

- [Risk] Users may miss where update/delete/select happen after tab removal. -> Mitigation: keep action buttons prominent in table and concise explanatory text near table.
- [Risk] Controller shell may assume tabs always exist. -> Mitigation: make tab section optional or pass minimal inline content block.
- [Trade-off] Knowledge Bases page diverges from strict “everything in tabs” pattern. -> Mitigation: document optional-tab rule in capability specs.

## Migration Plan

1. Refactor Knowledge Bases page to inline create section.
2. Remove three non-essential tabs and related copy.
3. Update tests for Knowledge Bases page and controller tabs suite.
4. Run lint/build/tests.

## Open Questions

- Should we add a brief inline helper note under the table heading explaining that update/select/delete live in row actions?
