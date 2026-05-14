## Why

The backend schema contract has migrated from YAML to JSON, so continuing to expose YAML terminology and formatting in the UI creates incorrect expectations and incompatible request/response handling. We need a coordinated frontend migration now to keep schema generation, validation, and creation workflows aligned with the live backend behavior.

## What Changes

- Replace user-facing schema workflow terminology from `YAML` to `JSON` across labels, tab names, descriptions, and workflow outputs.
- Update schema workflow data model and API usage to JSON-first naming and payload handling (for example `schemaJson`, `generateJson`, JSON schema content typing).
- Switch schema structured editors/previews to JSON format behavior and remove YAML formatting support from schema-oriented flows.
- Add and use multipart file-based schema generation endpoints for generate-schema and generate-example flows that now accept uploaded files directly.
- Update schema workflow tab ordering to the JSON workflow sequence.
- Update tests and validation suite to assert JSON-only schema behavior.
- **BREAKING**: Remove frontend YAML compatibility for schema input/output workflows.

## Capabilities

### New Capabilities
- `schema-json-migration-governance`: Defines migration guardrails so schema workflows are JSON-only and stale non-JSON backend schema formats are treated as unsupported.

### Modified Capabilities
- `schema-management-and-activation`: Change create/validate/get-by-id and schema content handling requirements from YAML terminology/format expectations to JSON-only behavior.
- `schema-generation-workflow`: Change generation flows and editable artifacts from YAML to JSON, including file-based backend multipart generation behavior.
- `field-labeling-and-output-descriptions`: Update structured payload format requirements to remove YAML expectations from schema workflows and keep JSON formatting/error behavior.
- `controller-page-tabbed-endpoint-workflows`: Update fixed Schemas tab sequence from YAML-named tabs to JSON-named tabs.

## Impact

- Affected UI code: schema page workflows, shared structured payload editor usage, schema API module, and schema DTO typing.
- Affected tests: schema page workflow tests, structured payload editor tests, and API module tests for multipart requests.
- Dependency impact: remove runtime `yaml` package if no non-schema runtime consumers remain.
- Backend API alignment: keep JSON body endpoints and add/consume multipart schema generation file endpoints.
