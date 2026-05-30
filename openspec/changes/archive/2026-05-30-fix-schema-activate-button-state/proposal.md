## Why

The schema list currently renders the same "Activate" action for every row even when a schema is already active, which misrepresents system state and allows redundant user actions. This creates UI inconsistency and avoidable activation requests.

## What Changes

- Update schema list row actions to reflect the real schema activation state.
- Show an active-state label for schemas already active instead of an actionable "Activate" command.
- Disable activation interaction for schemas already active so only inactive schemas can be activated.
- Preserve existing activation behavior for inactive schemas.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `schema-management-and-activation`: Activation controls in schema lists must mirror backend-reported active/inactive state and prevent activation of already active schemas.

## Impact

- Affected frontend feature: schema management page/table action column.
- Affected UI behavior: button labeling, disabled state, and row action affordance.
- No backend API contract changes.
