## Context

The Documents page currently keeps document intake as a single inline workflow: upload files, list documents, process a row, replace/delete rows, and inspect chunks. Processing calls `POST /api/v1/documents/{documentId}/process?allowOverwrite=false` and only sends `allowOverwrite=true` after confirmation for documents already marked completed or successfully processed.

The backend `dev` branch now exposes processing-option metadata and validation:

- `GET /api/v1/documents/{documentId}/processing-options` returns parser id, file format, saved defaults, saved default timestamp, and applicable option definitions.
- `PUT /api/v1/documents/{documentId}/processing-options/defaults` replaces document-scoped saved defaults.
- `DELETE /api/v1/documents/{documentId}/processing-options/defaults` clears document-scoped saved defaults.
- `POST /api/v1/documents/{documentId}/process` accepts a JSON body with `allowOverwrite` and `options` for one-run overrides.

Options are backend-owned and format-specific. Current examples include generic controls like `preserveLineBreaks`, DOCX controls like `docxRevisionMode`, and many PDF/Tika/OCR controls such as `pdf.split-pages`, `maxPages`, `pdf.ocr-dpi`, `ocr.language`, and `tika.write-limit`.

## Goals / Non-Goals

**Goals:**
- Let operators discover and edit applicable processing options for a selected uploaded document.
- Render option controls dynamically from backend metadata rather than hardcoding the current Tika option list.
- Support both saved document defaults and one-run processing overrides.
- Preserve the current simple row-level `Process` path for users who do not configure options.
- Keep the Documents page inline and controller-oriented while avoiding a crowded document table.
- Display page-aware chunk metadata when processing returns it.

**Non-Goals:**
- Add backend APIs or change backend validation behavior.
- Add authentication, authorization, or per-user option profiles.
- Expose processing-run history, because the backend has durable run records but no frontend-facing run-history endpoint in the inspected commits.
- Build a raw JSON-only editor as the primary options experience.

## Decisions

### Use a selected-document workflow area, not a separate route

Add an `Options` row action next to `Process`, `Replace`, `View chunks`, and `Delete`. The action selects that document and opens a selected-document workflow area below the table. That area uses purpose-based tabs such as `Chunks` and `Processing options`.

Rationale: options can be numerous, especially for PDF/Tika/OCR, so placing controls in every row would make the table hard to scan. A separate page would duplicate document selection and break the current inline workflow. Purpose tabs match the existing Schemas page pattern without reintroducing endpoint tabs on Documents.

Alternative considered: a modal launched from each row. This keeps the table compact, but option editing, validation errors, save state, and chunk inspection are easier to compare in an inline selected-document workspace.

### Treat backend option metadata as the source of truth

Add typed DTOs for processing options and build controls from `valueType`, `constraints`, `defaultValue`, `savedDefaultValue`, `mutable`, `label`, and `description`.

Control mapping:
- `BOOLEAN`: checkbox/toggle control.
- `INTEGER`: numeric input with min/max when supplied.
- `STRING` with `allowedValues`: select/menu.
- `STRING` without `allowedValues`: text input.
- `mutable=false`: read-only display, omitted from save and process payloads.

Rationale: backend commits made options discoverable specifically to avoid frontend churn as parsers gain parameters.

Alternative considered: hardcode known PDF/OCR fields. That would produce a nicer first-pass grouping but would regress as soon as the backend adds or removes options.

### Keep saved defaults and run overrides explicit

The processing-options tab should show the backend detected parser/file format, built-in defaults, saved defaults, and an editable draft initialized from `savedDefaultValue ?? defaultValue` for mutable options.

Actions:
- `Save defaults`: sends the current mutable draft as `{ options }` to the defaults endpoint and refreshes the options query.
- `Clear defaults`: sends `DELETE`, resets local draft from the returned backend state, and refreshes the options query.
- `Process with options`: sends `POST /documents/{id}/process` with body `{ allowOverwrite, options }`, where `allowOverwrite` follows the same confirmation rules as the row Process action.

The existing row `Process` action remains available and continues to process without option overrides, using backend built-in defaults plus any saved defaults.

Rationale: saved defaults and one-run overrides have different backend semantics. The UI must make it hard to accidentally mutate saved defaults while running an experiment.

Alternative considered: a single `Process` button that always sends the current form. This is simpler but hides the difference between persistent defaults and one-run overrides.

### Do not send both query and body `allowOverwrite` on option-aware process requests

When processing with options, send `allowOverwrite` in the JSON body and omit the query parameter. The backend rejects conflicting query/body values, so using one source avoids preventable validation errors. The legacy simple process call may continue using the existing query parameter for backwards compatibility.

### Query invalidation follows mutation scope

- Fetch options with `queryKeys.documentProcessingOptions(documentId)` and a nullable-safe variant.
- Saving or clearing defaults invalidates the processing-options query.
- Processing invalidates the documents list and selected document chunks, matching current behavior and ensuring page-aware chunks refresh.
- Replacing or deleting a selected document clears selected-document workflow state and invalidates chunks/options for that document.

## Risks / Trade-offs

- Backend may add many options with weak grouping metadata -> render a stable flat list with labels/descriptions first, then consider frontend grouping only if backend supplies categories later.
- Integer and string conversion bugs could produce avoidable validation errors -> parse values by backend `valueType`, omit empty string values only where invalid, and show backend validation messages without dropping the draft.
- Saving full effective defaults can persist values equal to built-in defaults -> acceptable for a clear and predictable first implementation; `Clear defaults` remains the reset path.
- Option-aware processing can take longer when OCR options are enabled -> reuse existing row pending state plus page progress banner and disable conflicting actions for the selected document.
- Page-aware chunk metadata shape is serialized JSON and may vary -> parse defensively and render known keys only when present.
