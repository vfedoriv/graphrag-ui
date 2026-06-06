## Context

The current Documents page is an inline controller workflow for listing documents, uploading a new file, processing a document, and inspecting chunks. The backend's latest document-management change added three frontend-relevant behaviors:

- `DocumentUploadResponse` now includes `localPath`.
- `PUT /api/v1/knowledge-bases/{knowledgeBaseId}/documents/{documentId}` replaces an existing document with a multipart `file` while preserving its id and resetting derived artifacts.
- `DELETE /api/v1/knowledge-bases/{knowledgeBaseId}/documents/{documentId}` deletes the document and document-scoped artifacts, returning `204`.

The frontend remains a browser SPA. It can render backend-provided `localPath` and can attempt to navigate to a `file://` `contentUri`, but an HTTP-served browser may block that navigation. The UI therefore needs both an open affordance and a reliable copy/path context fallback.

## Goals / Non-Goals

**Goals:**

- Add typed API client support for document replacement and deletion.
- Surface `localPath` in the document list so operators can identify the stored source file.
- Add row-level Replace and Delete actions that use the selected knowledge base id and target document id.
- Confirm destructive replacement/deletion before sending requests.
- Invalidate document and chunk queries affected by replacement/deletion so stale chunk output does not remain visible.
- Provide a direct open action for stored documents when a usable URI is available, plus a copyable local path fallback.

**Non-Goals:**

- No backend contract changes.
- No authentication, authorization, or permission model changes.
- No custom native desktop integration or browser extension to bypass browser local-file restrictions.
- No attempt to reprocess replacement documents automatically.

## Decisions

1. Extend the existing `documentsApi` module instead of creating a separate document-management module.

   Replacement and deletion are part of the same controller and query cache scope as upload, list, process, and chunks. Keeping them in `src/api/documents.ts` preserves the current feature-by-feature organization and makes cache invalidation straightforward.

2. Treat replacement as a row action using the shared file-select control pattern.

   The UI should add a Replace action beside Process and View chunks. Selecting a replacement file should require explicit confirmation before invoking the multipart `PUT`. This matches the current button-triggered upload convention while making clear that replacement clears derived artifacts.

3. Treat deletion as a confirmed destructive row action.

   Delete should require confirmation before invoking the `DELETE` endpoint. On success, the document list should refresh, selected chunk state should clear if the selected document was deleted, and the chunks query for that document should be invalidated or removed.

4. Open stored documents through the backend-provided URI when possible and show/copy the path always.

   If `contentUri` is a usable `file://` URI, the UI can render or trigger an open action using it. Because browsers commonly block `file://` navigation from HTTP pages, the row should also render `localPath` and a copy action when available. If only `localPath` is present, the UI can derive a file URI for the open attempt but must not depend on that succeeding.

5. Keep status and error feedback local to the document workflow.

   Upload, process, replace, delete, and chunk errors should remain visible near the Documents workflow. Row-level pending states should apply to the action and document that initiated the request so unrelated document rows remain usable where safe.

## Risks / Trade-offs

- Browser blocks opening `file://` links from the SPA -> Keep `localPath` visible and copyable so the operator can open the file manually.
- Replacement clears backend-derived artifacts -> Confirm before replacing and clear selected chunk output for the replaced document.
- Delete is irreversible from the UI -> Confirm before deleting and remove selected document/chunk state after success.
- Multiple row actions can make the Actions column crowded -> Use compact action grouping and preserve readable table layout on smaller screens.
- Backend may return `localPath` only for local filesystem storage -> Render source context conditionally and keep actions disabled or hidden when no source path/URI is available.
