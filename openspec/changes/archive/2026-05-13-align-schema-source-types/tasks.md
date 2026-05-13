## 1. Type Contract Alignment

- [x] 1.1 Locate all schema source type definitions in API DTOs and feature-level types
- [x] 1.2 Remove `USER_DEFINED` from frontend schema source type unions/enums and keep only `PREDEFINED` and `GENERATED`
- [x] 1.3 Update shared helpers/constants that map or format schema source type values

## 2. UI Workflow Updates

- [x] 2.1 Update schema-related UI controls to render only supported source types
- [x] 2.2 Remove any `USER_DEFINED`-specific branching from schema creation/generation/activation flows
- [x] 2.3 Add visible fallback handling for unexpected source types returned by API responses

## 3. Validation and Regression Coverage

- [x] 3.1 Update existing tests and fixtures that reference `USER_DEFINED`
- [x] 3.2 Add/adjust tests to verify only `PREDEFINED` and `GENERATED` are shown/submitted
- [x] 3.3 Run lint, targeted tests, and build checks for schema-related modules
