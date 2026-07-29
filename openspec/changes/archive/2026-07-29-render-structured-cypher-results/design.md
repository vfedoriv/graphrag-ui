## Context

`QueryExecutionResponse.rows` is typed as `Record<string, unknown>[]` because a Cypher column can contain JSON scalars, maps, lists, or backend-normalized nodes, relationships, and paths. The Execute Cypher tab currently passes every cell through `String(row[col] ?? '')`; this loses the distinction between null and blank values and converts every object to `[object Object]`. The shared table already accepts React nodes, and the existing UI has established monospace structured-output styling that can be reused without changing the backend contract.

## Goals / Non-Goals

**Goals:**

- Present every JSON-compatible query result value without losing nested content.
- Keep common scalar results compact and immediately readable.
- Make null visibly distinct from an empty string or missing display text.
- Contain formatted structured values within the existing responsive result area.
- Cover the real response shapes that exposed the defect.

**Non-Goals:**

- Changing Cypher execution requests, backend normalization, or response DTOs.
- Building a graph visualization or a general-purpose JSON tree editor.
- Flattening arbitrary nested objects into dynamically generated table columns.
- Adding editing, copying, sorting, filtering, or pagination behavior to query results.

## Decisions

### Use a dedicated query-result cell formatter

The Execute Cypher workflow will pass each unknown value through a small formatter that returns renderable content based on the runtime JSON type:

- strings render as plain text;
- numbers and booleans render as their textual values;
- null renders as an explicit `null` marker;
- arrays and objects render as indented JSON in a monospace preformatted region.

This keeps type handling close to the feature contract and prevents the shared `Table` component from acquiring query-specific semantics. Direct `String(...)` conversion was rejected because it destroys structured object content. Applying `JSON.stringify` to every value was rejected because it would add quotation marks to ordinary strings and make scalar-heavy tables noisier.

### Preserve the backend's nested response shape

Structured cells will serialize the received JSON-compatible value without flattening it. Backend-normalized `_type`, identifiers, labels, endpoints, properties, path nodes, and relationships therefore remain visible together. Flattening was rejected because arbitrary Cypher return shapes can collide on property names and produce unstable columns.

### Use contained preformatted presentation for structured cells

Structured values will use a feature-specific class or an appropriately compact reuse of existing output styling, with whitespace preservation, safe wrapping, and overflow contained by the table/result container. The cell presentation must not impose the existing full-size output preview's minimum height on every result row.

### Test behavior through the Execute Cypher workflow

Component tests will mock one response containing strings, numbers, booleans, null, nested maps, arrays, and at least one normalized graph value. Assertions will verify readable nested content and the absence of `[object Object]`. A focused formatter test may be added if the formatter is extracted into a standalone module, but it does not replace the workflow-level regression test.

## Risks / Trade-offs

- [Large nested values can make table rows tall] → Keep values inside a bounded, scrollable or wrapping cell presentation while preserving access to the complete serialized value.
- [Indented JSON can make result tables wider] → Retain the table container's horizontal overflow and add cell-local wrapping or overflow constraints.
- [A future non-JSON runtime value could fail serialization] → Keep the formatter exhaustive for values admitted by the HTTP JSON contract and provide a safe textual fallback rather than allowing rendering to fail.
- [Feature-local formatting could later be duplicated] → Start feature-local because query result semantics are specific; promote it to shared UI only when another workflow requires the same contract.
