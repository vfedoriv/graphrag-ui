## Why

The backend now exposes document-specific processing option metadata and accepts validated processing overrides, but the frontend still offers only a row-level `Process` button. Operators need a way to review applicable parser options, save document defaults, and run one-off processing overrides for PDFs, DOCX files, and text documents without guessing raw JSON payloads.

## What Changes

- Add a document processing options workflow to the Documents page for the currently selected document.
- Fetch backend-provided option definitions from `GET /api/v1/documents/{documentId}/processing-options` and render controls from the returned value type, constraints, defaults, saved defaults, mutability, labels, and descriptions.
- Allow users to save validated document-scoped defaults with `PUT /api/v1/documents/{documentId}/processing-options/defaults` and clear them with `DELETE /api/v1/documents/{documentId}/processing-options/defaults`.
- Allow users to process a document with per-run option overrides by sending `POST /api/v1/documents/{documentId}/process` with a JSON body containing `allowOverwrite` and `options`.
- Preserve existing simple Process behavior for users who do not open or change processing options.
- Surface option validation errors, unsupported document type errors, pending state, and saved-default state near the selected document workflow.
- Update chunk inspection to expose useful page-aware metadata when backend chunks include page, page count, parser, format, section, or processing-run metadata.

## Capabilities

### New Capabilities
- `document-processing-options-ui`: UI and API behavior for discovering document processing options, editing saved defaults, and applying one-run processing overrides.

### Modified Capabilities
- `document-ingestion-and-processing`: document processing requests may include option payloads while preserving existing overwrite confirmation and row-specific pending behavior.
- `documents-inline-upload-and-scrollable-chunks`: chunk inspection should surface page-aware metadata when returned by backend processing.

## Impact

- `src/api/types.ts`, `src/api/queryKeys.ts`, and `src/api/documents.ts` gain typed processing option DTOs, query keys, API calls, and mutations.
- `src/features/documents/DocumentsPage.tsx` gains selected-document processing option workflow controls and uses option-aware process requests.
- Documents page workflow tests and API tests need coverage for option discovery, defaults save/clear, one-run overrides, validation errors, and unchanged simple process behavior.
- No backend contract changes are proposed; this frontend consumes the backend behavior added on the backend `dev` branch by commits `9a26d90` and `98ca935`.
