## 1. Result Value Presentation

- [x] 1.1 Add a query-result cell formatter that renders strings, numbers, booleans, explicit nulls, objects, and arrays according to the design
- [x] 1.2 Replace unconditional `String(...)` conversion in the Execute Cypher result table with the type-aware formatter
- [x] 1.3 Add contained monospace styling for structured cells so multiline and wide JSON remains readable without overflowing the Queries page

## 2. Regression Coverage

- [x] 2.1 Extend the Execute Cypher workflow test response with mixed scalar, null, nested object, array, and normalized graph values
- [x] 2.2 Assert scalar and null presentation, complete nested structured content, and the absence of `[object Object]`
- [x] 2.3 Add focused formatter tests if the formatter is extracted into a standalone module

## 3. Validation

- [x] 3.1 Run the query feature tests and resolve any regressions
- [x] 3.2 Run `npm run lint`, `npm run test:run`, and `npm run build`
