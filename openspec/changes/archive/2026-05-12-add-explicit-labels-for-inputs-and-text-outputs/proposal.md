## Why

Many current input and text output elements rely on placeholders or surrounding context instead of explicit labels, which makes form intent less clear and reduces accessibility. We need consistent field labeling now so users can quickly understand each element’s purpose and assistive technologies can announce meaningful context.

## What Changes

- Add explicit visible labels for application input controls and text entry fields.
- Add descriptive labels/titles for text output regions (for example generated JSON/YAML/result previews).
- Keep exception: input fields embedded directly inside data tables do not require additional attached labels.
- Normalize label patterns across controller pages and shared form/output UI sections.

## Capabilities

### New Capabilities
- `explicit-field-and-output-labeling`: Standardized requirement that standalone inputs/text outputs include attached purpose labels, with table-embedded input exception.

### Modified Capabilities
- `controller-page-tabbed-endpoint-workflows`: Tab workflow panels must include explicit labels for standalone inputs and text outputs.

## Impact

- Affected frontend files: controller pages in `src/features/*` and potentially shared input/textarea/output wrappers in `src/shared/ui`.
- UI tests should be updated to validate label presence for critical fields/outputs.
- No backend/API contract changes.
