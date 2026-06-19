## 1. API And Types

- [x] 1.1 Extend runtime setting types only if backend responses expose pending or restart-applied values separately from `currentValue`.
- [x] 1.2 Add `BulkUpdateRuntimeSettingsRequest` and update item types for `{ updates: [{ key, value }] }`.
- [x] 1.3 Add an API helper and mutation for `PUT /runtime-settings` that returns `RuntimeSetting[]`.
- [x] 1.4 Replace corresponding runtime settings in the query cache from the bulk response and invalidate the runtime settings query after successful bulk updates or clears.

## 2. Settings Page Editing Flow

- [x] 2.1 Change runtime setting editability so mutable, non-sensitive, non-profile-managed settings are editable even when `liveApplied` is false.
- [x] 2.2 Replace per-row immediate update controls with local draft state, modified-row detection, reset/revert behavior, and a page-level apply changes action.
- [x] 2.3 Parse staged values by backend-reported type during apply and submit only modified editable settings.
- [x] 2.4 Show active current values separately from drafted or accepted pending values for restart-required settings.
- [x] 2.5 Show apply pending, success, and atomic failure feedback without hiding last known backend values or clearing rejected drafts.
- [x] 2.6 Keep read-only, sensitive, and profile-managed settings non-editable with backend-provided reason or update mode visible.
- [x] 2.7 Allow clear actions for mutable non-sensitive settings, including restart-required settings, while preserving restart-required messaging after accepted clears.

## 3. Tests And Validation

- [x] 3.1 Add API tests for `PUT /runtime-settings` bulk apply payloads, returned setting cache replacement, and query invalidation.
- [x] 3.2 Add Settings page tests for editable restart-required settings, local staging without immediate requests, apply button behavior, and changed-row detection.
- [x] 3.3 Add Settings page tests for active-versus-pending restart-required value display and atomic bulk rejection draft preservation.
- [x] 3.4 Add Settings page tests confirming read-only, sensitive, and profile-managed settings remain non-editable.
- [x] 3.5 Run `npm run lint`, `npm run test:run`, and `npm run build`.
