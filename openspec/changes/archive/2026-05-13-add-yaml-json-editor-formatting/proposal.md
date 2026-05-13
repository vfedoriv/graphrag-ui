## Why

YAML/JSON payloads are currently shown in plain text fields, which makes structure harder to scan and increases input mistakes. Adding format-aware editing/preview behavior will improve readability and authoring accuracy for schema/query workflows.

## What Changes

- Introduce YAML/JSON-aware text field behavior for relevant payload input/output areas.
- Add syntax-aware visual treatment (for example token coloring/format mode) where YAML/JSON is expected.
- Add lightweight format actions (for example prettify) to normalize payload readability before submit or review.
- Keep existing API contracts and workflows unchanged while improving editor clarity.
- Add focused tests for format-aware rendering and formatting behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `field-labeling-and-output-descriptions`: require payload fields/outputs to declare expected format (YAML vs JSON) and render with format-aware presentation.
- `schema-management-and-activation`: require schema YAML input/preview areas to support YAML-aware editing clarity.
- `query-authoring-and-execution`: require query parameter JSON input/preview areas to support JSON-aware editing clarity.

## Impact

- Affected code: shared input/output UI primitives and feature pages in schemas/queries (and any other YAML/JSON payload fields).
- No backend API changes.
- Improves usability, error prevention, and confidence when working with structured payloads.
