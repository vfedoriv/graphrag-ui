## 1. Schema Action State Rendering

- [x] 1.1 Update schema table row action rendering to branch on schema status.
- [x] 1.2 Show an active-state caption and disabled/non-interactive control for rows with `ACTIVE` status.
- [x] 1.3 Keep existing activate action behavior for rows that are not `ACTIVE`.

## 2. Verification Coverage

- [x] 2.1 Add or update UI tests for active rows asserting non-interactive action state.
- [x] 2.2 Add or update UI tests for inactive rows asserting activation mutation trigger remains intact.
- [x] 2.3 Run relevant test suite and validate no regression in schema activation flows.
