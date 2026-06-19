## Context

Runtime settings are loaded from `/api/v1/runtime-settings`. Individual updates are supported through `PUT /api/v1/runtime-settings/{key}` with `{ value }`, and the backend now also supports atomic bulk updates through `PUT /api/v1/runtime-settings` with `{ updates: [{ key, value }] }`, returning the updated runtime setting representations in request order. The Settings page currently treats a setting as editable only when it is `mutable`, `liveApplied`, non-sensitive, and not profile-managed. That hides editors for mutable restart-required settings, even though those values can be accepted by the backend and applied after process restart.

The frontend should use the backend bulk endpoint for the staged apply workflow. The endpoint is atomic: if any submitted setting is invalid, duplicated, non-allowlisted, or non-mutable, the request fails and no submitted runtime override is changed.

## Goals / Non-Goals

**Goals:**
- Make mutable restart-required runtime properties editable.
- Let users stage multiple runtime property changes before sending any update request.
- Submit staged changes through the backend atomic bulk update endpoint.
- Show a clear distinction between active current values and pending or accepted restart values.
- Keep read-only, sensitive, and profile-managed settings locked with visible reasons.
- Preserve validation/error feedback and drafts when the atomic bulk apply request fails.

**Non-Goals:**
- Add backend restart controls.
- Add authentication, authorization, or secret editing.
- Change backend API contracts from this frontend repo.
- Guarantee that restart-required values are active before the backend reports them as current after restart.

## Decisions

1. Treat `mutable && !sensitive && !profileManaged` as editable, independent of `liveApplied`.

   This aligns editability with backend mutability while still respecting sensitive and profile-managed restrictions. The `liveApplied` flag affects user messaging and value presentation, not whether the input can be edited.

   Alternative considered: keep restart-required settings read-only. That preserves the current behavior but prevents the intended operational workflow.

2. Stage edits in local page state and apply them through a single page-level action.

   Draft values should update only local state while the user edits. The apply action computes changed settings by comparing draft values to the last known backend current value, parses values by type, and submits only modified rows. This makes the update timing explicit and supports reviewing several changes together.

   Alternative considered: keep per-row update buttons. That is simpler mechanically but does not answer the user's concern about applying all edited properties together.

3. Use the backend atomic bulk update endpoint for the apply action.

   `runtimeSettingsApi` should expose an `updateMany`/`bulkUpdate` helper that calls `PUT /runtime-settings` with `{ updates: [{ key, value }] }`. The mutation should replace the corresponding settings in the TanStack Query cache from the returned list and invalidate the runtime settings query after success.

   Alternative considered: submit one `PUT /runtime-settings/{key}` request per changed setting. That is no longer appropriate now that the backend provides atomic bulk behavior and would reintroduce partial-success states the backend endpoint is designed to avoid.

4. Show restart-required values as active plus pending.

   For live-applied settings, the updated backend response should replace the current value immediately. For restart-required settings, the row should continue showing the active current value and additionally show either the accepted value returned by the backend or the submitted pending value with a "Restart required" status. If the backend later returns a dedicated pending value field, the DTO should use that field as the source of truth.

   Alternative considered: replace the displayed current value immediately for restart-required settings. That obscures what is actually active until the backend restarts.

## Risks / Trade-offs

- Atomic bulk apply failure leaves all submitted overrides unchanged -> show one apply error in the runtime properties section, keep all modified drafts editable, and do not clear changed markers until a successful apply.
- Backend may not return pending restart values distinctly from current values -> preserve submitted accepted values in frontend state until the next catalog refresh, and prefer backend-provided pending fields when available.
- Duplicate or stale changed keys can cause the atomic request to fail -> compute changed settings from current draft state immediately before submit and submit each modified key at most once.
- Restart-required semantics may vary by backend property -> rely on `liveApplied`, `updateMode`, and backend response metadata rather than hard-coded property keys.
