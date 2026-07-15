## Context

The schema-draft workbench ends with a reviewed effective projection; it intentionally does not create or activate a registered schema. The backend now adds three further stages: held-out dry evaluation, revision/hash-bound publication as a normal inactive generated schema, and asynchronous post-activation reprocessing plans. Each stage has different safety and retry semantics, and the backend explicitly keeps them separate.

This change depends on the route, draft detail cache, revision handling, source/candidate context, and result views from `add-schema-draft-workbench`. The backend now exposes paged evaluation history, paged draft-filtered reprocessing history, draft workflow references, explicit evaluation eligibility, and typed deterministic/advisory result contracts. These resources make reload recovery, history, eligibility, and semantic metric rendering server-authoritative.

## Goals / Non-Goals

**Goals:**

- Expose held-out evaluation with clear deterministic versus advisory results.
- Make readiness blockers actionable and publish only the exact ready revision/hash.
- Preserve publication, activation, and reprocessing as separate confirmed actions.
- Show publication audit linkage and post-publication content drift.
- Provide durable reprocessing progress, per-document safety outcomes, and retry controls.

**Non-Goals:**

- Automatically publishing, activating, or reprocessing.
- Editing published draft evidence or decisions.
- Replacing the existing registered-schema activation endpoint or document processing semantics.
- Presenting advisory model judgments as deterministic validation.
- Changing backend API contracts in the frontend repository.

## Decisions

### Add a staged release section to the selected draft

The published workflow is presented as a visible sequence rather than a single wizard transaction:

```
Reviewed draft -> Held-out evaluation -> Readiness -> Publish inactive schema
                                                        |
                                                        v
                                              Explicit activation
                                                        |
                                                        v
                                            Explicit reprocessing plan
```

Each completed stage remains independently inspectable. Actions for later stages are disabled until their backend preconditions are visible, but users can move back to inspect evidence and evaluation. A combined publish-and-migrate action was rejected because it would misrepresent backend atomicity and make partial processing hard to understand.

### Load held-out eligibility from the backend

Evaluation selection loads `GET .../evaluation-eligible-documents`, whose standard page envelope includes document metadata, `eligible`, an optional `ACTIVE_DISCOVERY_EVIDENCE` reason, the evaluated draft revision, and current aggregate ID. Only eligible rows are selectable. Selected document IDs, advisory-enabled state, and the current response revision form the start request.

The eligibility query is keyed by knowledge base, draft, page, and size and is invalidated after changes that can alter discovery evidence or the current aggregate. The start control is disabled if the eligibility snapshot no longer matches current draft state, forcing a refresh instead of guessing eligibility locally.

### Poll evaluation and plan resources through typed status hooks

Start/retry mutations return an ID and status location. Dedicated queries poll active statuses and stop for terminal statuses. Terminal evaluation invalidates readiness; terminal reprocessing invalidates document lists and active-schema-related context. Page and size are part of status query keys because detailed status responses contain standard nested page envelopes under `outcomes` and `items`; the frontend does not read removed parallel count fields.

On route entry, `DraftResponse.latestEvaluation` and `latestReprocessing` provide lightweight navigation references. Paged evaluation history supplies currentness, retryability, lineage, counts, reproducibility identifiers, timestamps, and status locations. Paged reprocessing history is filtered by owned draft and supplies latest/target-current/retryable flags, lineage, counts, timestamps, and status locations. Active resources resume polling through their detailed status endpoints; stale history remains inspectable. Browser persistence is unnecessary for correctness.

### Separate deterministic metrics from advisory assessments

The evaluation result uses distinct panels and language. Deterministic extraction/validation metrics are typed as identified rate and count collections. Rates show numerator, denominator, calculated value, applicability, and evidence; count metrics show count and evidence; evaluation reasons remain explicit. `NOT_APPLICABLE` values render as such rather than zero.

Advisory results display the explicit execution status, intended-question coverage, schema-noise coordinate assessments, reasons, warnings, and profile/prompt/contract reproducibility metadata. `NOT_REQUESTED`, model-free completion, and failure states remain visually distinct from deterministic results. No generic payload inspector or inferred threshold is needed.

Historical `schema-draft-evaluation-v1` runs are rendered through the same typed response model while their original contract revision remains visible. Empty evidence, reason, or advisory-detail collections on those runs mean the older record did not persist those details; they are not presented as affirmative evidence that no issue existed.

### Treat readiness as a short-lived publication token

The readiness query returns `draftRevision`, `aggregateRevisionId`, `projectionContentHash`, target identity, and all blocking reasons. Publish uses exactly the returned revision and hash. Any draft/review mutation invalidates readiness immediately. The publish action requires confirmation that publication creates an inactive schema only.

On a stale revision/hash conflict, the UI discards the cached readiness token, refetches review state and readiness, and does not retry automatically. Idempotent success returns the existing publication result and is rendered normally.

### Reuse registered schema activation and cache invalidation

After publication, the release view shows the returned schema ID and current activation state. Activation calls the existing knowledge-base schema endpoint and uses the same invalidations as the Schemas page. The UI then refetches publication details to distinguish inactive, active, and content-drifted states.

Navigation to the normal Schemas page or Schema Builder remains available for allowed inactive-schema editing, with a warning that edits can create publication drift.

### Make reprocessing scope and retry consequences explicit

Plan creation offers `allDocuments` or explicit document selection, never both. Optional processing options reuse the existing document processing option shape and editor behavior. Creation is available only while the published schema is active for the current knowledge base.

The plan view shows aggregate counts and paged items, distinguishing success, failure, stale source, blocked, interrupted, and skipped outcomes. Retry requires an explicit `resnapshotUnresolvedDocuments` choice with explanatory copy; matching successes remain historical and are not presented as rerun work.

## Risks / Trade-offs

- [The latest evaluation may be stale after the draft changes] → Respect the summary/reference `current` flag and bind retry/start behavior to the current draft revision.
- [The latest reprocessing target may no longer be active/current] → Respect `targetCurrent` and backend `retryable` flags rather than deriving safety from recency.
- [Eligibility pages can become stale after analysis or source changes] → Compare the returned draft revision/current aggregate with current draft state and invalidate eligibility on relevant mutations.
- [Typed metric identifiers may grow] → Render known identifiers semantically and preserve a safe unknown-enum contract error without inventing formulas or thresholds.
- [Readiness becomes stale after any review mutation] → Key it by draft/aggregate revision, invalidate it on mutations, and publish only its exact token.
- [Users may assume publication activates the schema] → Use distinct step labels, confirmations, statuses, and separate buttons.
- [Large reprocessing plans can produce extensive item data] → Poll aggregate pages economically, paginate outcomes, and stop polling terminal plans.
- [Published schema edits invalidate reviewed equivalence] → Show publication and current hashes plus drift prominently without blocking allowed backend edits.

## Migration Plan

1. Complete `add-schema-draft-workbench` and capture matching backend fixtures for workflow references, histories, eligibility, metrics, and advisory results.
2. Add evaluation/publication/reprocessing DTOs, API functions, query keys, and contract tests.
3. Add evaluation selection, polling, result, retry, and recovery UI.
4. Add readiness blocker and guarded publication UI.
5. Reuse activation from the release sequence with existing invalidations.
6. Add reprocessing scope/options, polling, outcomes, and retry UI.
7. Validate unit, workflow, coverage, build, and browser end-to-end behavior against the matching backend.
8. Roll back by removing release sections and hooks; already published schemas and running plans remain backend-owned resources.
