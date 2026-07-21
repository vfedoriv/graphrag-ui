## 1. Align the Evaluation Contract

- [x] 1.1 Update evaluation run types so run-level metrics and advisory assessment are nullable and outcome statuses include every backend lifecycle value.
- [x] 1.2 Update strict Zod schemas to accept nullable run results and validate declared run and outcome status enums without accepting undeclared fields.

## 2. Present Progress and Result Availability

- [x] 2.1 Refactor held-out evaluation rendering so run status, aggregate counts, paged outcomes, and retry controls do not depend on completed result objects.
- [x] 2.2 Render deterministic metrics and advisory assessment independently when available, with explicit in-progress or unavailable states when absent.
- [x] 2.3 Preserve polling for accepted queued and running responses and stop it for every terminal run status.

## 3. Add Regression Coverage

- [x] 3.1 Add active and interrupted evaluation fixtures with nullable run results and queued, running, reused, or interrupted outcomes as appropriate.
- [x] 3.2 Extend API validation tests to accept lifecycle-valid nullable responses and continue rejecting undeclared response fields and status values.
- [x] 3.3 Extend release workflow tests to verify active progress rendering without a shape error, continued polling, terminal unavailable-result rendering, and unchanged completed-result presentation.

## 4. Validate the Change

- [x] 4.1 Run the focused schema draft release API and workflow tests.
- [x] 4.2 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
