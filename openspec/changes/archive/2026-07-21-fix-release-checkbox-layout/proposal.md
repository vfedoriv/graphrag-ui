## Why

The optional advisory-assessment checkbox in the Release workflow is stretched by the global form-control layout, causing the checkbox indicator to appear detached from its label in the middle of the panel. The control should read as one compact, intentional choice and remain usable across viewport sizes and themes.

## What Changes

- Present the advisory-assessment checkbox and its label as a single left-aligned inline control.
- Prevent checkbox and radio inputs in Release choices from inheriting full-width text-input sizing.
- Preserve the existing advisory opt-in behavior, explanatory copy, and evaluation request payload.
- Add regression coverage for the semantic label association and the dedicated Release choice styling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-publication-ui`: Require optional Release choices to render as compact, left-aligned controls whose indicator remains adjacent to its label.

## Impact

- Affects `SchemaDraftReleaseWorkflow` markup and shared or feature-scoped form-control styling.
- Extends Release workflow component tests.
- Does not change backend APIs, DTOs, evaluation semantics, or dependencies.
