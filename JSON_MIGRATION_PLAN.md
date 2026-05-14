# Frontend JSON Schema Migration Plan

## Summary

Migrate the frontend schema workflows from YAML terminology and formatting to JSON-only behavior, matching backend commit `e4347bc` (`migrate schema format from yaml to json`). The UI will no longer accept or format YAML for schema content, generated schema outputs will be JSON, schema API helpers will use JSON names, and file-based schema workflows will call the backend multipart file endpoints.

## Key Changes

- Update OpenSpec first with a new change, e.g. `migrate-schema-workflows-to-json`, covering current specs for schema management, schema generation, field labels, and tab ordering.
- Replace all user-facing schema labels, tab names, placeholders, pending text, test IDs where practical, and error messages from `YAML` to `JSON`.
- Rename schema workflow state/functions from YAML terms to JSON terms: `yaml` -> `schemaJson`, `generateYaml` -> `generateJson`, `SchemaGenerateYamlFromText/File` -> `SchemaGenerateJsonFromText/File`.
- Use `StructuredPayloadEditor format='json'` for create, validate, generated schema output/editing, and schema examples where structured JSON is expected.
- Remove YAML runtime formatting support from `StructuredPayloadEditor`; keep only JSON formatting unless another non-schema feature needs YAML.
- Remove direct `yaml` dependency from `package.json` and `package-lock.json` after confirming no remaining runtime imports.
- Tighten API types: add `SchemaFormat = 'JSON'`, set `Schema.format: SchemaFormat`, and add/use `SchemaDetails` for `GET /schemas/{id}` because backend details include JSON `content`.

## API Alignment

- Keep endpoint paths for JSON body flows:
  - `POST /api/v1/schemas`
  - `POST /api/v1/schemas/validate`
  - `POST /api/v1/schemas/generate`
  - `POST /api/v1/schemas/generate/example`
- Add multipart helpers:
  - `schemasApi.generateJsonFromFile({ name, version, description?, example, file })` -> `POST /schemas/generate/from-file`
  - `schemasApi.generateExampleFromFile({ userPrompt?, file })` -> `POST /schemas/generate/example/from-file`
- Multipart `generateJsonFromFile` sends:
  - `request`: JSON `Blob` with `{ name, version, description, example }`
  - `file`: selected `File`
- Multipart `generateExampleFromFile` sends:
  - optional `userPrompt`
  - `file`
- Preserve `apiFetch` behavior that avoids overriding `Content-Type` for `FormData`.

## UI Behavior

- Schema tab order becomes:
  - Generate schema example from text
  - Generate schema example from file
  - Generate schema JSON
  - Generate schema JSON from file
  - Validate schema JSON
  - Create schema
  - Get schema by ID
- Generated schema JSON output remains editable and can be copied into validate/create flows.
- File-based tabs use the actual selected file for backend multipart calls instead of reading file text client-side.
- Validation/create errors from backend remain surfaced through existing alerts.
- Existing archived OpenSpec history remains unchanged as historical record; current specs and active code/tests/docs are migrated.

## Test Plan

- Update shared editor tests to cover valid JSON formatting and invalid JSON errors only.
- Update schema page tests for JSON labels, JSON tab IDs/test IDs, `format: 'JSON'`, and generated JSON response content.
- Add API tests for multipart `generateJsonFromFile` and `generateExampleFromFile`, asserting `FormData` body and endpoint paths.
- Update workflow tests to validate JSON payload submission and generated JSON output propagation into validate/create workflows.
- Run validation:
  - `npm run lint`
  - `npm run test:run`
  - `npm run coverage`
  - `npm run build`

## Assumptions

- This is a breaking migration: no YAML input compatibility or YAML formatting fallback in the frontend.
- Backend `SchemaFormat.YAML` is removed, so frontend should treat any non-`JSON` schema format from API as unsupported/stale data.
- Create schema still sends `sourceType: 'PREDEFINED'` unless product direction changes.
- Historical archived OpenSpec files may still mention YAML; active specs and executable code should not.
