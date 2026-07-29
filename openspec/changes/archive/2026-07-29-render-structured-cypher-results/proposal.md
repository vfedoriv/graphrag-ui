## Why

The Execute Cypher workflow currently coerces every result cell with JavaScript string conversion, causing valid object-valued results such as Cypher map projections, nodes, relationships, and paths to appear as `[object Object]`. Users need to inspect the complete backend response without rewriting otherwise valid queries to return only scalar columns.

## What Changes

- Render scalar Cypher result values without changing their user-facing meaning.
- Render object and array result values as readable structured JSON instead of implicit JavaScript strings.
- Preserve null values and nested backend response content without confusing them with empty strings.
- Keep wide or multiline structured results contained within the result table layout.
- Add regression coverage for mixed scalar, null, object, array, and graph-entity-shaped result cells.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `query-authoring-and-execution`: Require Execute Cypher results to present scalar and structured cell values accurately and readably.

## Impact

- Affects the Execute Cypher result presentation in `src/features/queries`.
- May introduce a feature-local or shared value-formatting presentation helper.
- Extends query workflow component tests with nested result payloads.
- Does not change backend APIs, request payloads, response DTOs, or dependencies.
