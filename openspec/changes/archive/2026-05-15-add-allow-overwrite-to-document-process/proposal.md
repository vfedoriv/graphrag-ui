## Why

The backend document processing endpoint now requires an explicit `allowOverwrite` confirmation when re-processing files that were already processed successfully. The UI must expose this confirmation path so users can intentionally reprocess files without backend contract mismatches or ambiguous retries.

## What Changes

- Add `allowOverwrite` support to the frontend document processing request payload/parameters used by the Documents workflow.
- Keep first-time processing behavior unchanged by defaulting `allowOverwrite` to `false` unless the user explicitly confirms overwrite processing.
- Add a user confirmation flow when processing a document that was already successfully processed, then resend processing with `allowOverwrite=true` after confirmation.
- Surface backend responses/errors for overwrite-required cases in a clear, actionable way on the Documents page.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `document-ingestion-and-processing`: Document processing requirements are updated so the UI supports explicit overwrite confirmation and passes `allowOverwrite` when reprocessing already-processed documents.

## Impact

- Affected frontend modules in document processing API client/types and Documents feature mutation workflow.
- No new backend API introduced; existing process endpoint contract is updated with new boolean input.
- Tests for document processing workflow and API request construction need updates/additions for overwrite confirmation behavior.
