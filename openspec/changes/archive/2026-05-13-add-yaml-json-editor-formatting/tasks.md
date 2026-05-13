## 1. Shared Structured Payload Editor Support

- [x] 1.1 Add or extend a shared text-editor component with explicit `json`/`yaml` format modes.
- [x] 1.2 Add manual formatting action that prettifies valid structured payloads and reports parse errors without destructive edits.
- [x] 1.3 Preserve backward compatibility for existing plain-text usage.

## 2. Feature Integration

- [x] 2.1 Integrate JSON mode into query parameter fields and relevant JSON output previews.
- [x] 2.2 Integrate YAML mode into schema YAML create/validate/generate fields and relevant previews.
- [x] 2.3 Ensure format labels/guidance are explicit in the UI for structured payload fields.

## 3. Regression Coverage and Validation

- [x] 3.1 Add unit/integration tests for formatting success/failure behavior in shared component.
- [x] 3.2 Add feature tests covering format-aware behavior in query and schema workflows.
- [x] 3.3 Run targeted test suite and build.
