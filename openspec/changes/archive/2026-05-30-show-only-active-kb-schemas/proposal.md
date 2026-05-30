## Why

The Schemas page currently shows schemas across knowledge bases even when an active knowledge base is selected, which makes it harder to understand the relevant schema context and increases the chance of acting on unrelated schemas. The schema list should be scoped to the active knowledge base to align with the rest of the controller workflow.

## What Changes

- Scope schema list rendering on the Schemas page to the currently active knowledge base.
- Ensure the table displays only schemas associated with the selected knowledge base.
- Show an explicit empty-state message when the selected knowledge base has no schemas.
- Preserve schema activation and related workflows for the filtered list.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `schema-management-and-activation`: Schema list behavior on the Schemas page must be filtered by the active knowledge base context.

## Impact

- Affected frontend feature: Schemas page table/list data selection and empty-state handling.
- Affected workflow behavior: schema browsing and activation context alignment with selected knowledge base.
- No backend API contract changes required.
