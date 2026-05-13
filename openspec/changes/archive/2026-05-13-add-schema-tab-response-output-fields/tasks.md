## 1. Schema Tab Output State

- [x] 1.1 Locate the Schemas tab components for `Generate schema YAML`, `Generate schema YAML from file`, and `Get schema by ID`
- [x] 1.2 Add per-tab response output state so each tab keeps its own latest successful backend result
- [x] 1.3 Clear stale output for a tab when a new request starts in that same tab

## 2. UI Rendering for Response Fields

- [x] 2.1 Add an output text field to `Generate schema YAML` bound to its response state
- [x] 2.2 Add an output text field to `Generate schema YAML from file` bound to its response state
- [x] 2.3 Add an output text field to `Get schema by ID` bound to its response state
- [x] 2.4 Ensure output fields update with latest successful responses and do not overwrite other tabs

## 3. Validation and Tests

- [x] 3.1 Add or update component tests to verify response rendering for each affected tab on success
- [x] 3.2 Add or update tests for repeat requests to confirm output replacement with latest response
- [x] 3.3 Run `npm run lint` and targeted test commands for schema feature changes
