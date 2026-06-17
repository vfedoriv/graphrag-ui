## Why

The Schemas list action buttons currently align based on each button label's intrinsic text width and can appear to have inconsistent heights, especially around `Delete`. This makes the action column look unstable even though the actions are functionally equivalent across rows.

## What Changes

- Normalize Schemas list row action button widths and heights so `Activate`/`Active`, `Details`, `Update`, and `Delete` align consistently across rows.
- Keep the actions in the same order and preserve existing activation, details, update, delete, pending, disabled, and error behavior.
- Ensure the action column remains usable in the scrollable table on desktop, tablet, and mobile widths.
- Avoid backend API or data contract changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-management-and-activation`: Require schema list row action controls to use stable action slots or equalized button dimensions so alignment does not depend on button text length or variant-specific button height.

## Impact

- Affected UI: `src/features/schemas/SchemasPage.tsx`
- Affected styles: `src/index.css` or shared table/action classes
- Affected tests: schema page tests may need assertions for stable action classes or row action rendering
- API contracts: no backend changes expected
- Dependencies: no new runtime dependencies expected
