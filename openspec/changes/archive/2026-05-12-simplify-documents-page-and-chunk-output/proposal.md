## Why

The Documents page currently spreads workflow across tabs that add navigation overhead for common operations. Chunk inspection also needs a constrained text viewport so large outputs remain readable without stretching the layout.

## What Changes

- Remove endpoint tabs from the Documents page.
- Keep `Upload document` as part of the main Documents page layout.
- Remove `Process document` and `Inspect document chunks` tab sections from the page.
- Keep chunk inspection accessible from the document list `View chunks` action.
- Render chunk output in a text container with both horizontal and vertical scrollbars so long lines and large payloads do not expand page width.

## Capabilities

### New Capabilities
- `documents-inline-upload-and-scrollable-chunks`: Define tabless document workflow with inline upload and scrollable chunk text output.

### Modified Capabilities
- `document-ingestion-and-processing`: Update Documents page behavior from tabbed endpoint workflows to a single-page flow with action-driven chunk inspection.
- `controller-page-tabbed-endpoint-workflows`: Exclude Documents page from mandatory endpoint tab structure.

## Impact

- Affected UI modules in `src/features/documents` and shared output rendering components.
- Document workflow tests need updates to reflect removed tabs and new chunk rendering constraints.
- No backend API contract changes.
