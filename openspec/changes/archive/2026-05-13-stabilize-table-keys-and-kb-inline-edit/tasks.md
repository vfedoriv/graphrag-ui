## 1. Stable Row Identity in Shared Table

- [x] 1.1 Extend `Table` component API to support explicit stable row keys.
- [x] 1.2 Keep backward compatibility for existing table usages that do not yet provide row keys.

## 2. Knowledge Base Inline Edit Safety

- [x] 2.1 Pass stable row keys (knowledge base IDs) from Knowledge Bases page into the shared table.
- [x] 2.2 Gate inline rename `onBlur` updates so no mutation is sent when the value is unchanged.
- [x] 2.3 Preserve current selected-knowledge-base behavior during delete/update flows.

## 3. Regression Coverage and Validation

- [x] 3.1 Add or extend tests to verify no update request is sent on unchanged blur.
- [x] 3.2 Add or extend tests to verify row identity stays consistent through delete/update interactions.
- [x] 3.3 Run targeted tests and build for table and knowledge-base workflows.
