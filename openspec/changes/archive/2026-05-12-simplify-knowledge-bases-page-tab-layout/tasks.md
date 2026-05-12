## 1. Knowledge Bases Page Layout Simplification

- [x] 1.1 Remove endpoint tabs from Knowledge Bases page composition.
- [x] 1.2 Render `Create knowledge base` form as an always-visible inline section on the page.
- [x] 1.3 Keep update/delete/select actions in table rows and ensure behavior remains unchanged.

## 2. Controller Shell Optional Tabs Support

- [x] 2.1 Update controller page composition (if needed) to support pages that omit endpoint tabs cleanly.
- [x] 2.2 Ensure no placeholder/empty tab UI is rendered for tabless controller pages.

## 3. Test and Validation Updates

- [x] 3.1 Update Knowledge Bases and controller-page tests to reflect removed tabs and inline create form.
- [x] 3.2 Run lint/build/tests and fix regressions.
