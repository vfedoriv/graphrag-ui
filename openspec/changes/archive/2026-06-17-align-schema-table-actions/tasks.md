## 1. Schema Table Action Layout

- [x] 1.1 Replace the Schemas list action toolbar with a stable row-action container or equivalent scoped class.
- [x] 1.2 Apply equalized action button width and height so `Active`, `Activate`, Details, Update, and Delete controls align consistently.
- [x] 1.3 Preserve existing action order, disabled states, pending states, and button variants.

## 2. Tests and Verification

- [x] 2.1 Add or update Schemas page tests to assert row action controls use the stable action layout/classes.
- [x] 2.2 Verify existing activation, details, update, and delete workflow tests still pass.
- [x] 2.3 Run `npm run lint`, `npm run test:run`, and `npm run build`.
