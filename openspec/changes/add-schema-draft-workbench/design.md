## Context

The frontend currently has a single `/schemas` controller page for registered-schema generation, validation, creation, mutation, and activation. Its text/file generators are synchronous and their editable output is local component state. The backend now adds a separate knowledge-base-owned planning domain under `/api/v1/knowledge-bases/{knowledgeBaseId}/schema-drafts`: drafts have optimistic revisions, three source types, durable background analysis, immutable aggregate revisions, evidence-backed candidates, append-only review decisions, conflicts, projections, and diffs.

This is too stateful and deep for another tab on the existing Schemas page. It also introduces asynchronous resources whose status must remain authoritative across navigation. The frontend must preserve the distinction between a draft planning artifact and a registered schema that can be activated.

The backend now returns canonical typed guidance in draft responses, exposes lightweight `currentAnalysis`, `latestEvaluation`, and `latestReprocessing` workflow references, provides paged analysis-run history, and declares a typed candidate page. The frontend can therefore recover authoritative workflow state after navigation without browser-retained identifiers and can render review state without inferring response shapes.

## Goals / Non-Goals

**Goals:**

- Provide one coherent multi-source draft workbench scoped to the globally selected knowledge base.
- Model backend resources and optimistic revisions with explicit TypeScript DTOs and TanStack Query ownership.
- Support sequential source mutations, durable analysis polling and retry, evidence review, decisions, conflict resolution, projections, and diffs.
- Preserve unsent edits across request errors and make stale-revision conflicts actionable.
- Keep registered schemas and schema drafts visibly separate.

**Non-Goals:**

- Replacing or removing existing single-source schema generation.
- Adding a UI for the stateless `/schemas/discover` endpoints in this change.
- Publishing or activating a draft, evaluating held-out documents, or reprocessing documents.
- Editing backend contracts from this repository or synthesizing missing authoritative job state in browser state.
- Automatically accepting candidates or resolving semantic conflicts.

## Decisions

### Use a dedicated lazy route with URL-addressable selection

Add `/schema-drafts` for the knowledge-base-scoped list/create surface and `/schema-drafts/:draftId` for a selected workbench. The primary navigation points to the list route. A knowledge-base change clears an incompatible draft selection and all nullable queries remain disabled until both ownership identifiers are known.

This keeps the complex workflow out of the already dense Schemas page and gives refreshable/deep-linkable draft context. An alternative was another Schemas purpose tab; it was rejected because source management, analysis, review, and later release stages form a resource workspace rather than a single endpoint action.

### Separate typed API domains while sharing contracts

Add a `schemaDrafts` API module and feature-local DTO modules for lifecycle, workflow references, sources, analysis history, candidates, decisions, conflicts, projection, and diff. Candidate, evidence, origin, guidance, and naming-rule types mirror the explicit backend contracts. One reusable `PageResponse<T>` models candidates, run histories, and nested `sourceOutcomes` using zero-based `page`, bounded `size`, `totalElements`, and `content`; no compatibility adapter is added for removed list-plus-count fields. Only genuinely open structured values such as projection schemas, decision values, conflict alternatives, and diff before/after payloads remain `unknown` at transport boundaries and are narrowed before rendering.

Stable keys nest under knowledge base and draft, for example draft lists, detail, sources, analysis history by page, analysis status/outcomes by run and page, candidates by page, decisions, conflicts, projection, and diff. Mutations update or invalidate the detail revision before another revision-bearing command is enabled.

An alternative was adding all new records to the already broad `src/api/types.ts`; feature-local types were chosen to keep the large planning domain cohesive without expanding unrelated API consumers.

### Serialize revision-bearing mutations

Every draft, guidance, source, decision, and resolution mutation sends the latest cached draft revision. Bulk-looking UI actions, such as adding several document sources, execute one request at a time and adopt the returned/refetched revision before the next request. Conflicting actions are disabled while a revision-bearing mutation is pending.

On HTTP 409, the UI retains the user's unsubmitted form or selected files, refetches draft-owned resources, and presents a conflict message with an explicit retry after review. It never automatically replays a semantic decision against a newer aggregate.

Parallel submissions using the same revision were rejected because predictable optimistic conflicts would create partial, confusing results.

### Make source type and lifecycle state explicit

The source table presents `DOCUMENT`, `FILE`, and `TEXT` separately and never suggests that draft files or pasted text are normal ingested documents. Document selection comes from the current knowledge base's document query; direct file and text inputs use their dedicated endpoints. Only metadata returned by the backend is retained after submission.

Actions depend on source state: active document sources can become stale or unavailable and may be refreshed; analyzed removed sources are inactive and restorable; destructive removal is confirmed. The UI refetches both source and draft detail after each mutation because source membership advances the draft revision and affects analysis currency.

### Recover and poll server-owned analysis state

Starting or retrying analysis stores the returned run ID in query state and begins bounded polling. `RUNNING` polls continue; `COMPLETED`, `PARTIAL`, and `FAILED` stop polling and invalidate draft detail, analysis history, candidates, conflicts, projection, and diff. Partial and failed runs preserve paged per-source outcomes and expose retry only when the response permits it.

On route entry, `DraftResponse.currentAnalysis` identifies the applicable current run and its status location. Paged `GET .../analysis-runs` supplies recent history, currentness, retryability, retry lineage, aggregate linkage, counts, timestamps, and status locations. The UI resumes polling a current running reference and keeps stale historical runs inspectable without treating them as current. Browser storage is unnecessary for correctness.

### Organize review by candidate, conflict, and result

The selected-draft page uses purpose-oriented sections: Overview, Sources, Analysis, Candidates, Conflicts, Projection, and Diff. Candidate rows expose identity, kind, normalized coordinates, support count, confidence, origins, evidence, and review state. Accept/reject are concise actions; modify/pin open a structured editor seeded from the candidate and require the candidate identity/kind to remain unchanged. Rationale is optional but visible in decision history.

Conflict resolution shows alternatives and evidence, then requires exactly one backend-supported alternative or a custom structured resolution. Projection and before/after diff values use existing structured/readable JSON primitives; compatibility classes are prominent and filterable.

An alternative was editing the generated projection directly. It was rejected because the backend persists decisions and resolutions, not arbitrary projection replacements.

### Round-trip canonical typed guidance

Draft create, list, detail, metadata update, and guidance update responses return the canonical `DraftGuidance` envelope together with guidance revision and fingerprint. The editor initializes from that value, preserves `additionalInstructions` separately from structured discovery guidance, and submits only documented fields. Validation failures preserve the editor and never mutate cached authority.

## Risks / Trade-offs

- [A draft may reference a historical analysis that is no longer current] → Respect the reference/summary `current` flags and never infer currentness from recency alone.
- [Canonical guidance rejects unknown or invalid fields] → Model the documented envelope explicitly, retain rejected form input, and surface normalized validation details.
- [Recommendation and persistent review state can be confused] → Render `recommendationState` and `effectiveReviewState` as separate labeled dimensions and use `latestDecisionId` for history linkage.
- [Many dependent queries can refetch excessively after each decision] → Update the returned draft revision deliberately, invalidate only affected review/result keys, and keep paged candidate data cached.
- [Multi-select source addition can partially succeed] → Serialize requests, show per-item success/failure, and leave failed selections available for retry.
- [Large evidence and diff payloads can overwhelm the page] → Paginate candidates/outcomes, collapse evidence by default, filter diffs, and lazy-load selected workbench sections.

## Migration Plan

1. Capture representative typed guidance, workflow-reference, analysis-history, and candidate-page fixtures from the matching backend.
2. Add DTOs, API functions, query keys, boundary guards, and contract tests without changing existing schema APIs.
3. Add the lazy route and navigation entry with list/create/detail lifecycle behavior.
4. Add source management and serialized revision mutations.
5. Add analysis polling/recovery and outcome views.
6. Add candidate decisions, conflicts, projection, and diff sections.
7. Run lint, unit/workflow tests, coverage, build, and browser flows against the matching backend.
8. Roll back by removing the route/navigation entry and unused frontend modules; backend drafts remain intact.
