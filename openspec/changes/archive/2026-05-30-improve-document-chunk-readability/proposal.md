## Why

Document chunk inspection currently renders the entire chunk response as one large JSON payload. Long `text` fields make the output hard to scan, compare, and validate during normal document review.

## What Changes

- Replace the raw-only chunk output with a dual-mode inspector.
- Default chunk inspection to a readable view made of per-chunk cards.
- Preserve a raw JSON mode for debugging and API verification.
- Show key chunk fields such as chunk index, id, token estimate, source metadata, and readable chunk text without forcing users to parse a full JSON document.
- Keep the output bounded so large chunk sets and long text do not destabilize the page layout.

## Capabilities

### New Capabilities


### Modified Capabilities

- `documents-inline-upload-and-scrollable-chunks`: Change chunk inspection from raw JSON-only output to a readable default view with an explicit raw JSON mode.

## Impact

- Affected UI: `src/features/documents/DocumentsPage.tsx` and likely shared UI additions or styles under `src/shared/ui` if reusable primitives are useful.
- Affected tests: Documents page tests and workflow tests covering chunk rendering.
- APIs: No backend API or DTO contract changes expected; the UI continues to consume the existing document chunks endpoint.
- Dependencies: No new runtime dependency expected.
