## Why

The schema-draft Diff view presents breaking removals without identifying what the current projection is compared against or whether a removal follows an explicit review decision. This makes correct results look like unexplained data loss, especially for drafts with no configured base schema where the backend silently uses the previous aggregate.

## What Changes

- Require diff responses to include the draft revision and a structured comparison baseline containing its type, exact identifier when one exists, and immutable content hash.
- Display a concise comparison summary naming the current aggregate and the base schema, previous aggregate, or empty starting point used as the baseline.
- Correlate diff coordinates with the latest candidate decisions already loaded by the workbench and label changes caused by explicit reject decisions.
- Explain that `Breaking` describes compatibility impact, while a decision-origin label explains why the change exists.
- Add contract, rendering, fallback, and responsive tests for the clarified diff experience.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Make the Diff view identify its comparison baseline and distinguish intentional decision-driven removals from unexplained compatibility changes.

## Impact

- Affected frontend code: schema-draft diff DTO/validation, Diff rendering in `SchemaDraftsPage.tsx`, decision-to-coordinate correlation, fixtures, and tests.
- External backend dependency: the backend `DiffResponse` will expose `draftRevision` and an optional-during-rollout `baseline` object containing `type` (`BASE_SCHEMA`, `PREVIOUS_AGGREGATE`, or `EMPTY`), nullable `id`, and `contentHash`. That backend contract change is defined by the matching backend change; this frontend repository will only consume it.
- No change is proposed to diff calculation or compatibility classification.
