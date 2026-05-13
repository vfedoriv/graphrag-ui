## Why

The UI currently allows or models a `USER_DEFINED` schema source type that does not exist in the backend contract. This mismatch creates invalid client behavior and confusion in schema flows.

## What Changes

- Align schema source type handling in the UI with backend-supported values only: `PREDEFINED` and `GENERATED`.
- Remove `USER_DEFINED` from schema source type enums, UI options, and related validation/formatting paths.
- Update behavior requirements so schema management workflows only expose and process backend-supported source types.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `schema-management-and-activation`: constrain schema source type behavior to backend-supported enum values and remove unsupported source type exposure.

## Impact

- Affected UI areas: schema list/detail rendering, schema creation and generation workflows, and source type presentation.
- Affected API integration surface: schema DTO typing and enum mapping logic in frontend code.
- No backend API changes; this is a frontend contract-alignment update.
