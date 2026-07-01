## 1. API Contracts

- [x] 1.1 Add document processing option DTO types, request types, and value aliases in `src/api/types.ts`.
- [x] 1.2 Add nullable-safe processing option query-key factories in `src/api/queryKeys.ts` and update query-key tests.
- [x] 1.3 Add API methods for get processing options, save defaults, clear defaults, and option-aware process requests in `src/api/documents.ts`.
- [x] 1.4 Add TanStack Query hooks/mutations for processing options, including invalidation for defaults save/clear and option-aware processing.
- [x] 1.5 Extend document API tests to verify endpoint URLs, JSON bodies, nullable disabled queries, and mutation invalidations.

## 2. Option Form Model

- [x] 2.1 Implement helpers that build editable option drafts from backend definitions using `savedDefaultValue ?? defaultValue`.
- [x] 2.2 Implement value parsing/serialization for `BOOLEAN`, `INTEGER`, and `STRING` options so payload values match backend validation expectations.
- [x] 2.3 Implement a dynamic processing option control component for boolean, integer, free-text string, allowed-value string, and read-only immutable options.
- [x] 2.4 Preserve draft values across backend validation failures and reset drafts from fresh backend data after successful save or clear.

## 3. Documents Page Workflow

- [x] 3.1 Add selected-document workflow state that can open either chunk inspection or processing options from document row actions.
- [x] 3.2 Add an `Options` row action that selects a document and opens the processing-options workflow without navigating away from Documents.
- [x] 3.3 Render selected-document purpose tabs for `Chunks` and `Processing options` while keeping Documents free of endpoint tabs.
- [x] 3.4 Render parser/file-format context, option controls, built-in/default/saved value indicators, pending state, and errors in the processing-options workflow.
- [x] 3.5 Add `Save defaults`, `Clear defaults`, and `Process with options` actions using the new mutations.
- [x] 3.6 Reuse existing overwrite confirmation behavior for option-aware processing and send `allowOverwrite` only in the JSON body for that request.
- [x] 3.7 Clear selected-document workflow state and related option/chunk state after successful replace or delete of the selected document.

## 4. Chunk Metadata Display

- [x] 4.1 Parse chunk metadata defensively and extract known page-aware fields such as page number, page count, parser id, file format, section index, and processing run id.
- [x] 4.2 Render available page-aware metadata in labeled fields in the readable chunk view without showing placeholders for missing values.
- [x] 4.3 Keep the raw JSON chunk view unchanged as the complete response inspection path.

## 5. Tests and Validation

- [x] 5.1 Add Documents page workflow tests for opening options, rendering dynamic option controls, saving defaults, clearing defaults, and unsupported document errors.
- [x] 5.2 Add Documents page workflow tests for processing with options, completed-document overwrite confirmation, declined overwrite, validation errors, and row-specific pending state.
- [x] 5.3 Add chunk inspector tests for page-aware metadata rendering and missing metadata behavior.
- [x] 5.4 Run `npm run lint`.
- [x] 5.5 Run `npm run test:run`.
- [x] 5.6 Run `npm run build`.
