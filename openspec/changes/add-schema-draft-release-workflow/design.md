## Context

The schema-draft workbench ends with a reviewed effective projection; it intentionally does not create or activate a registered schema. The backend now adds three further stages: held-out dry evaluation, revision/hash-bound publication as a normal inactive generated schema, and asynchronous post-activation reprocessing plans. Each stage has different safety and retry semantics, and the backend explicitly keeps them separate.

This change depends on the route, draft detail cache, revision handling, source/candidate context, and result views from `add-schema-draft-workbench`. Current backend evaluation and plan resources can be retrieved only by known ID, and metrics/advisory payloads are generic objects. Those limitations constrain durable recovery and semantic metric rendering.

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

### Derive held-out choices conservatively

Evaluation selection starts from documents owned by the selected knowledge base and excludes active `DOCUMENT` draft sources shown in the source list. The backend remains authoritative and can reject any document that contributed evidence but is not identifiable from available metadata. Selected document IDs, advisory enabled state, and current draft revision form the start request.

This conservative filter may exclude a document source that did not contribute evidence, but it prevents the UI from advertising obviously invalid held-out choices without requiring it to load every candidate page.

### Poll evaluation and plan resources through typed status hooks

Start/retry mutations return an ID and status location. Dedicated queries poll active statuses and stop for terminal statuses. Terminal evaluation invalidates readiness; terminal reprocessing invalidates document lists and active-schema-related context. Page and size are part of status query keys because outcomes/items are paged.

Reload recovery requires backend current/list operations for evaluation runs and reprocessing plans. Browser persistence can retain a convenience link to a recently started resource, but it cannot establish that it is current or enumerate history. The feature does not claim durable recovery until the backend prerequisite is available.

### Separate deterministic metrics from advisory assessments

The evaluation result uses distinct panels and language. Deterministic extraction/validation metrics show formulas, counts, rates, and not-applicable denominators when the backend contract supplies typed fields. Advisory question coverage and schema-noise judgments are labeled as model assessments and show reproducibility metadata and evidence coordinates.

Until exact payload schemas are documented, generic structured inspectors may expose raw objects for diagnosis, but implementation cannot assign semantic labels or thresholds to unknown fields. An alternative was to infer the Java map shape from example responses; it was rejected as a fragile contract.

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

- [No list/current evaluation or plan endpoints exist] → Gate durable reload recovery on backend discoverability and avoid treating browser IDs as authoritative.
- [Evaluation metric objects are not typed] → Require documented payload contracts for semantic rendering; use a generic structured inspector only as a transparent fallback.
- [UI eligibility filtering can be incomplete] → Exclude all active document sources conservatively and preserve normalized backend rejection details.
- [Readiness becomes stale after any review mutation] → Key it by draft/aggregate revision, invalidate it on mutations, and publish only its exact token.
- [Users may assume publication activates the schema] → Use distinct step labels, confirmations, statuses, and separate buttons.
- [Large reprocessing plans can produce extensive item data] → Poll aggregate pages economically, paginate outcomes, and stop polling terminal plans.
- [Published schema edits invalidate reviewed equivalence] → Show publication and current hashes plus drift prominently without blocking allowed backend edits.

## Migration Plan

1. Complete `add-schema-draft-workbench` and confirm backend run-discovery and evaluation-metric contracts.
2. Add evaluation/publication/reprocessing DTOs, API functions, query keys, and contract tests.
3. Add evaluation selection, polling, result, retry, and recovery UI.
4. Add readiness blocker and guarded publication UI.
5. Reuse activation from the release sequence with existing invalidations.
6. Add reprocessing scope/options, polling, outcomes, and retry UI.
7. Validate unit, workflow, coverage, build, and browser end-to-end behavior against the matching backend.
8. Roll back by removing release sections and hooks; already published schemas and running plans remain backend-owned resources.

## Open Questions

- Which endpoint will enumerate or identify the current evaluation run and reprocessing plan after reload?
- What are the stable JSON schemas for evaluation aggregate metrics, per-document metrics, and advisory assessment?
- Should the backend expose evaluation-eligible document IDs directly, or is conservative frontend filtering plus backend validation the intended contract?
