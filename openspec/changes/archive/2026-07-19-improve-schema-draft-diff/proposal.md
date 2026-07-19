## Why

The Schema Drafts workbench currently presents compatibility changes as generic notice blocks whose dense, delimiter-based summaries, oversized colored surfaces, and raw before/after payloads are difficult to scan and become visually awkward when expanded or keyboard-focused. The Diff section should help reviewers quickly understand the scope and risk of schema evolution while preserving access to exact values.

## What Changes

- Replace generic notice-based diff rows with a dedicated, accessible diff review list that has clear disclosure controls and a stable visual hierarchy.
- Add a compact result summary with total and visible change counts, plus compatibility breakdowns that make overall risk apparent at a glance.
- Present coordinates, human-readable operation labels, and compatibility status as distinct summary elements instead of a single punctuation-delimited line.
- Improve compatibility and operation filters with descriptive labels, normalized option text, result feedback, and a clear-filter action.
- Render expanded before and after states in legible, responsive comparison panels, including explicit treatment of missing/null values and structured JSON.
- Preserve lazy disclosure so detailed payloads are not rendered until a row is expanded, and add focused component tests for filtering, disclosure, accessibility, empty results, and narrow layouts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Strengthen the compatibility diff requirements with scan-friendly summaries, accessible disclosure and filtering, risk/result counts, and responsive before/after comparison behavior.

## Impact

- Affects the Diff section in `src/features/schema-drafts/SchemaDraftsPage.tsx`, with likely extraction into a feature-local diff review component.
- Adds dedicated Diff styles in `src/index.css` and updates Schema Drafts component tests.
- Reuses the existing diff DTO and `/api/v1` request behavior; no backend contract, dependency, or route changes are required.
