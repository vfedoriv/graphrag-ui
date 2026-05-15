## Context

The Documents page currently triggers document processing against the backend without an overwrite confirmation parameter. Backend contract changes now introduce `allowOverwrite` for process requests to explicitly confirm re-processing of files that were already processed successfully. The frontend must support this without breaking first-time processing or existing error visibility patterns.

## Goals / Non-Goals

**Goals:**
- Keep normal processing flow unchanged for documents that have not been successfully processed yet.
- Add a safe and explicit confirmation path for re-processing previously successful documents.
- Ensure process API calls include `allowOverwrite` with correct boolean semantics.
- Preserve clear inline feedback for processing success and failure.

**Non-Goals:**
- Changing backend API behavior or response schema.
- Introducing batch overwrite processing UX.
- Redesigning the Documents page layout beyond required confirmation affordances.

## Decisions

1. Process request contract update in API layer
- Decision: extend the process request type/helper to accept `allowOverwrite: boolean`, defaulting to `false` at call sites.
- Rationale: centralizes contract alignment in the typed API client and keeps request construction explicit.
- Alternative considered: infer overwrite from document status and never expose user confirmation. Rejected because backend requires explicit confirmation intent and users need control.

2. Two-step process flow when overwrite is required
- Decision: when a document row indicates completed/successful processing status, show a confirmation dialog before sending process request; if user confirms, send process with `allowOverwrite=true`; for all other statuses, send process with `allowOverwrite=false`.
- Rationale: matches product expectation for explicit overwrite confirmation at the point of action and avoids avoidable failed calls.
- Alternative considered: detect overwrite need only by backend response and then prompt. Rejected as less user-friendly and because status data is already available in UI.

3. Deterministic backend error handling
- Decision: treat HTTP `409 Conflict` as overwrite-not-allowed signal for requests sent with `allowOverwrite=false`.
- Rationale: backend contract now defines this condition explicitly, enabling deterministic client branching and clearer test expectations.
- Alternative considered: parse only free-form backend message text. Rejected due to fragility.

## Risks / Trade-offs

- Backend may return `409` for different conflict cases in future -> Mitigation: combine status code check with request context (`allowOverwrite=false`) and user-facing message text scoped to reprocess path.
- Additional retry branch can increase mutation complexity -> Mitigation: isolate retry logic in a small helper and cover both primary and overwrite-confirm paths with tests.
- If document status in list is stale, users may hit confirmation unexpectedly -> Mitigation: retain backend-driven truth and provide clear prompt text explaining why confirmation is needed.

## Migration Plan

1. Update document processing API types and request function to include `allowOverwrite`.
2. Update document process action flow to show confirmation dialog for completed/success documents and send `allowOverwrite=true` only after confirmation.
3. Add/update tests for API request payload and overwrite-confirm retry behavior.
4. Validate with lint, test run, and build before merge.

Rollback: revert frontend changes to process request shape and confirmation logic; backend remains compatible with requests that send `allowOverwrite=false` by default.

## Open Questions

- None.
