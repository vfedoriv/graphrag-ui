## Context

Backend commits expanded durable schema-draft analysis responses with structured source failure codes, immutable per-run discovery budgets, and a split between persisted failure classification (`retryable`) and current retry-command eligibility (`canRetry`). The frontend currently uses strict Zod objects, lacks these fields in its TypeScript model, and gates Retry directly on `retryable`, so the updated backend responses are rejected and the action semantics are incorrect.

The affected path spans feature-local contracts and validation, TanStack Query consumers, fixtures/API tests, and the Analysis workbench. Legacy runs remain readable through null budget and failure-code fields. Runtime discovery settings need no special integration because the Settings page already renders the backend catalog generically.

## Goals / Non-Goals

**Goals:**

- Accept and type the complete backend analysis detail, history, and source-outcome contract.
- Preserve the semantic distinction between failure classification and current action eligibility.
- Make captured budgets and privacy-safe detailed source failures useful to operators.
- Keep general analysis-start availability tied to authoritative active-run state rather than the selected historical run.
- Cover current, legacy, and mixed retryability/eligibility responses with regression tests.

**Non-Goals:**

- Change backend DTOs, endpoints, retry rules, runtime-setting behavior, or request payloads.
- Infer missing legacy budgets from current settings.
- Expose raw exception messages, prompts, model output, source content, or provider-sensitive diagnostics.
- Add cancellation controls or alter the polling interval.

## Decisions

### Model additive fields explicitly while retaining strict object validation

Add `failureCode: string | null` to source outcomes; add nullable effective concurrency and timeout fields plus `canRetry: boolean` to detail and summary types. Mirror them in both strict Zod objects.

Strict validation remains valuable for detecting contract drift. The failure code itself is validated as a nullable string rather than a closed frontend enum so a future additive backend code does not make the whole Analysis page unusable. Known codes can still receive human-readable presentation through a formatter with a safe fallback.

Alternative considered: make the objects permissive with `.passthrough()`. This would restore compatibility quickly but weaken the established contract-validation boundary for every future field.

### Treat null as historical absence, never as a live default

Effective execution-policy fields are nullable because legacy graph records do not contain them. The UI will format each available captured value and use a clear “Unavailable for legacy run” state when absent. It will not query or copy current runtime settings into historical run diagnostics.

Alternative considered: show current settings for legacy runs. That would look complete but would misrepresent the policy under which the historical analysis actually ran.

### Separate diagnostic and action semantics

`retryable` is displayed as information about the run's failures. Retry button visibility and enabled state use `canRetry`. This permits explicit reanalysis of completed and permanent-failure runs while preventing an action when resource state currently blocks it.

The backend remains authoritative: `canRetry` is a snapshot hint and mutation errors stay visible. After a rejected retry, the frontend refreshes draft detail, analysis history, and selected run so the hint converges to current state.

Alternative considered: combine both booleans when gating Retry. That would incorrectly hide valid explicit reanalysis for `retryable=false, canRetry=true`.

### Derive general Start availability independently from selected history

Selecting a terminal historical run must not imply that the draft has no active analysis. The Analysis section will derive active-workflow state from the authoritative draft workflow reference and/or returned running history, while selected-run polling remains responsible for the selected detail view.

Alternative considered: keep using only the selected run status. This creates a false-enabled Start action after the user selects history during another active run.

### Present diagnostics compactly in the existing controller layout

The selected-run summary will include a compact captured-policy block with concurrency and human-readable durations. The source-outcomes table will show broad category, detailed code, and retryability in its Failure cell. Existing responsive primitives and pagers remain unchanged.

Alternative considered: add a separate diagnostics route or modal. The metadata is small and belongs to the run being inspected, so another navigation layer would add complexity without improving comprehension.

## Risks / Trade-offs

- [Risk] A future backend failure code has no friendly label → Show a normalized fallback derived from the returned stable code while retaining the exact code for auditability.
- [Risk] `canRetry` becomes stale after the response is rendered → Treat it as a hint, show mutation errors, and invalidate authoritative queries after rejection or success.
- [Risk] Additional history columns become crowded on narrow screens → Use compact labels or secondary text within existing cells and preserve responsive table behavior.
- [Risk] Legacy null metadata could be mistaken for zero → Render explicit unavailable text and never use numeric fallbacks.
- [Risk] Active-run detection sources briefly disagree during invalidation → Prefer authoritative active workflow state, conservatively disable Start while any loaded source reports a running analysis, and let backend validation remain final.

## Migration Plan

1. Update types, validators, fixtures, and parser tests together so the frontend can communicate with the expanded backend contract.
2. Switch Retry gating to `canRetry` and add authoritative invalidation behavior.
3. Add captured-policy and detailed-failure presentation plus workbench tests.
4. Validate with lint, focused tests, the full test run, coverage, and production build.

Rollback consists of reverting the frontend change; no data migration or backend rollback is required. The reverted frontend will not be compatible with the expanded strict response contract.

## Open Questions

None. The backend contract and semantics are defined by the latest backend OpenSpec and DTOs.
