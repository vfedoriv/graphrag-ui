## 1. Schema List Layout

- [x] 1.1 Remove schema ID from the primary Schemas list table columns while preserving row keys and ID usage for API calls.
- [x] 1.2 Add a schema details row action that retrieves details using the row schema ID and renders the latest details/error state in the Schemas page context.
- [x] 1.3 Align activation, details, update, and delete controls in a stable actions column that does not shift based on preceding column content.
- [x] 1.4 Keep activation, update, delete, unsupported source type, empty state, and request progress feedback working after the table layout change.

## 2. Purpose-Based Schema Workflows

- [x] 2.1 Replace the Schemas page endpoint tab container with purpose-based workflow tabs beneath the schema list.
- [x] 2.2 Group text and file schema example generation controls under source-mode options in a schema example generation tab.
- [x] 2.3 Group text and file schema JSON generation controls under source-mode options in a schema JSON generation tab.
- [x] 2.4 Keep schema validation and schema creation as separate workflow tabs using the shared editable schema JSON draft.
- [x] 2.5 Remove the manual get schema by ID workflow field and tab-specific output from the Schemas page.

## 3. Form Sizing and Responsiveness

- [x] 3.1 Constrain short schema name inputs to a sensible max width on desktop while allowing full-width layout on small screens.
- [x] 3.2 Constrain schema version numeric inputs to a smaller content-oriented width while preserving label association and keyboard accessibility.
- [x] 3.3 Verify textareas and structured schema JSON editors continue to shrink within their parent container without horizontal page overflow.

## 4. Tests and Validation

- [x] 4.1 Update Schemas page tests that currently assert endpoint tab order or tab navigation to assert purpose-based tabs instead.
- [x] 4.2 Add or update workflow tests for row-driven schema detail retrieval, including success replacement and error feedback.
- [x] 4.3 Update tests for schema generation, validation, and creation workflows to use the new tab and source-mode structure.
- [x] 4.4 Run `npm run lint`, `npm run test:run`, and `npm run build`.
