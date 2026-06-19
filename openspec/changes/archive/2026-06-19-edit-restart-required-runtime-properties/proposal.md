## Why

Restart-required runtime settings currently appear non-editable in the UI even when the backend marks them mutable, which blocks the expected workflow of changing a setting now and applying it after the backend restarts. The current per-row update flow also makes multi-setting configuration changes harder to review before sending them to the backend.

## What Changes

- Allow editable controls for mutable, non-sensitive runtime settings even when they require backend restart before the new value takes effect.
- Stage runtime property edits locally instead of sending an update immediately when a row value changes.
- Add a single page-level action that sends all modified runtime property values through the backend bulk update endpoint in one intentional operation.
- Show restart-required settings with both the currently active backend value and the pending value that will apply after restart once the backend accepts the update.
- Keep read-only, sensitive, and profile-managed settings non-editable with visible backend-provided reasons.
- Surface pending, success, validation error, and restart-required status clearly in the runtime properties section.

## Capabilities

### New Capabilities

### Modified Capabilities
- `runtime-properties-management`: Mutable restart-required settings become editable as staged changes, and runtime settings updates are applied through an explicit batch-oriented UI action.

## Impact

- Affects `src/features/settings/SettingsPage.tsx` runtime properties editing behavior and presentation.
- Affects `src/api/runtimeSettings.ts` to call `PUT /api/v1/runtime-settings` with `{ updates: [{ key, value }] }` and handle the returned list of updated settings.
- Affects runtime settings DTO handling if the backend exposes accepted pending/restart values separately from active current values.
- Requires focused tests for editable restart-required settings, local drafts, apply action behavior, pending-value display, and non-editable settings.
