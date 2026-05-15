## 1. Row-Scoped Process Pending State

- [x] 1.1 Add row-level process state tracking in Documents page (active processing document id).
- [x] 1.2 Update Process button rendering so pending/loading text applies only to the row whose id matches active processing id.
- [x] 1.3 Ensure row-level process state is cleared reliably for success, failure, overwrite-confirm decline, and retry completion paths.

## 2. Regression Coverage and Validation

- [x] 2.1 Add/update Documents workflow tests that assert only the clicked row changes to pending while other rows remain unchanged.
- [x] 2.2 Run `npm run lint`, `npm run test:run`, and `npm run build` to validate no regressions.
