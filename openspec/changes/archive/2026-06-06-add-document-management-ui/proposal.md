## Why

The backend now supports document replacement, deletion, and local source-file path metadata, but the Documents page only supports upload, processing, and chunk inspection. Operators need to manage uploaded files from the frontend without leaving the GraphRAG UI and need enough source context to locate or open the stored document when running the UI in a trusted local environment.

## What Changes

- Extend the frontend document DTO and API module for the backend's new `localPath` response field.
- Add document replacement from the Documents page using the backend multipart `PUT /knowledge-bases/{knowledgeBaseId}/documents/{documentId}` operation.
- Add document deletion from the Documents page using the backend `DELETE /knowledge-bases/{knowledgeBaseId}/documents/{documentId}` operation.
- Show document source context in the Documents list, including the local filesystem path when available.
- Provide an open action that attempts to open the stored document through the browser/OS association using the backend-provided file URI, with a copyable local path fallback for environments where browsers block local file links.
- Preserve existing upload, process, and chunk inspection workflows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-ingestion-and-processing`: Documents can be replaced, deleted, and inspected with backend-provided source-file context from the Documents page.

## Impact

- Affected code: `src/api/types.ts`, `src/api/documents.ts`, `src/features/documents/DocumentsPage.tsx`, and related tests.
- Backend API assumptions: uses the latest backend document contract from commit `7b9e180` with `localPath`, multipart `PUT`, and `204` delete responses under `/api/v1`.
- No new frontend runtime dependencies are expected.
- Browser security may prevent `file://` opening from an HTTP-served SPA; the UI should still expose and copy the local path so operators can open it manually when direct opening is blocked.
