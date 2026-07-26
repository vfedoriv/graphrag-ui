## Why

The backend now returns structured source failure codes, immutable execution-budget metadata, and separate `retryable` and `canRetry` analysis-run semantics. The frontend's strict response validators reject these additive fields today, and its Retry action still treats failure classification as command eligibility.

## What Changes

- Extend schema-draft analysis detail, history, and nested source-outcome contracts to accept the new backend fields while preserving nullable legacy-run metadata.
- **BREAKING**: Drive retry-action availability from `canRetry`; retain `retryable` only as failure-classification information.
- Show privacy-safe detailed failure codes alongside broad failure categories and source retryability.
- Show the execution concurrency and timeout budgets captured by each analysis run, with an explicit legacy-unavailable state.
- Keep analysis start and retry failures visible when backend revalidation rejects stale revision, eligibility races, or capacity changes.
- Add contract, API, and workbench regression coverage for current and legacy responses and for independent retryability/eligibility combinations.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-source-analysis-ui`: Align durable analysis parsing, diagnostics, history, and retry actions with the expanded backend run contract.

## Impact

- Affects schema-draft types, strict Zod validation, API fixtures/tests, and the Analysis section of the schema-draft workbench.
- Consumes additive fields from the existing backend `/api/v1` schema-draft analysis detail and history responses; no backend contract changes are introduced here.
- Uses the existing runtime-settings catalog unchanged because discovery settings are already rendered generically.
- Adds no new frontend dependency and does not alter authentication, routing, or backend request payloads.
