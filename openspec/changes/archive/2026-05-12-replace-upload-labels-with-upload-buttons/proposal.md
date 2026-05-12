## Why

Current upload interactions look like plain text labels that open file chooser dialogs when clicked, which is unclear and inconsistent with expected button-driven actions. We need explicit upload buttons now to improve discoverability and reduce user confusion.

## What Changes

- Replace label-driven file-picker interactions with explicit button-triggered file selection controls.
- Keep hidden/native file inputs for browser file chooser compatibility, but trigger them via visible buttons.
- Apply this pattern consistently in all current file-upload workflows (Documents upload and schema generation from file flows).
- Preserve existing backend API calls and payload behavior after file selection.

## Capabilities

### New Capabilities
- `button-triggered-file-selection`: Standardized explicit button UX for opening file chooser dialogs in upload/generation workflows.

### Modified Capabilities
- `document-ingestion-and-processing`: Document upload entry point changes from label click to explicit upload button interaction.
- `schema-generation-workflow`: Schema generation from file workflows use explicit file-select buttons instead of clickable labels.

## Impact

- Affected frontend files: `src/features/documents/DocumentsPage.tsx`, `src/features/schemas/SchemasPage.tsx`, and shared UI helpers if extracted.
- No backend API or contract changes.
- UI tests need updates/additions to verify button presence and file chooser trigger behavior.
