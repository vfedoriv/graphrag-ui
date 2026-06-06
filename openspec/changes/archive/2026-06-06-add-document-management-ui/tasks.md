## 1. API Contract

- [x] 1.1 Add optional `localPath` to the `DocumentUpload` DTO type.
- [x] 1.2 Add `documentsApi.replace(knowledgeBaseId, documentId, file)` using multipart `PUT /knowledge-bases/{knowledgeBaseId}/documents/{documentId}`.
- [x] 1.3 Add `documentsApi.delete(knowledgeBaseId, documentId)` using `DELETE /knowledge-bases/{knowledgeBaseId}/documents/{documentId}` and support the backend `204` empty response.
- [x] 1.4 Add replace and delete TanStack Query mutations that invalidate the affected knowledge-base document list and affected document chunks.

## 2. Documents Page UI

- [x] 2.1 Render document source context in the Documents list, including `localPath` when present and no broken placeholder when absent.
- [x] 2.2 Add an Open action that attempts to open `contentUri` or a file URI derived from `localPath`, while preserving visible path context for blocked browser local-file navigation.
- [x] 2.3 Add a Copy path action for documents with `localPath`.
- [x] 2.4 Add a confirmed Replace row action using the shared file-select button pattern and row-specific pending feedback.
- [x] 2.5 Add a confirmed Delete row action with row-specific pending feedback.
- [x] 2.6 Clear selected chunk output when the selected document is replaced or deleted.
- [x] 2.7 Surface replace and delete errors near the document workflow while keeping the document list visible.

## 3. Tests

- [x] 3.1 Extend document API tests to cover replacement multipart `PUT`, deletion `204`, and query invalidation.
- [x] 3.2 Extend Documents page tests for local path rendering, missing path handling, open/copy actions, and blocked-open fallback visibility.
- [x] 3.3 Extend Documents page workflow tests for confirmed/declined replacement, replacement failure, delete confirmation, delete failure, and selected chunk clearing.

## 4. Validation

- [x] 4.1 Run `npm run lint`.
- [x] 4.2 Run `npm run test:run`.
- [x] 4.3 Run `npm run build`.
