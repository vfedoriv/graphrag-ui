## Context

The Diff tab currently receives only the current aggregate ID and flattened changes. The backend chooses a comparison source internally: a configured base schema, otherwise the previous current aggregate, otherwise an empty schema. Because that choice is absent from `DiffResponse`, the frontend cannot accurately name the baseline or bind the result to a draft revision. The workbench already loads decision history, so exact diff coordinates can be correlated with their latest candidate decisions without another endpoint.

The backend contract is owned by the adjacent GraphRAG repository. This frontend change must consume, but must not implement, the new backend fields.

## Goals / Non-Goals

**Goals:**

- Make the compared current and baseline resources explicit before users inspect individual changes.
- Preserve the backend's compatibility classifications and exact before/after values.
- Distinguish compatibility impact from decision provenance for exact coordinate matches.
- Handle rollout safely while frontend and backend versions briefly differ.

**Non-Goals:**

- Recalculating diffs in the browser.
- Changing which baseline the backend selects.
- Reclassifying `BREAKING`, `REVIEW_REQUIRED`, or `ADDITIVE` results.
- Guessing decision provenance for parent or child coordinates that do not match a decision identity exactly.

## Decisions

### Consume explicit baseline metadata from the backend

Extend the frontend diff contract with `draftRevision` and a nested `baseline` descriptor containing `type: 'BASE_SCHEMA' | 'PREVIOUS_AGGREGATE' | 'EMPTY'`, `id: string | null`, and `contentHash: string`. Keep `aggregateRevisionId` as the current side of the comparison. Explicit metadata is preferred over deriving the previous aggregate from analysis history because backend promotion lineage, snapshots, and base-schema selection are authoritative implementation details.

### Use a compatibility rollout

Initially declare `draftRevision` and `baseline` optional in the strict Zod schema and TypeScript DTO, while requiring `type`, `id`, and `contentHash` whenever `baseline` is present. Render a neutral “comparison baseline unavailable” summary when it is absent. Deploy this frontend compatibility layer before the backend adds the fields. After backend deployment is complete, a follow-up can make them required. Declaring known fields optional preserves unknown-key rejection while avoiding a backend-first or frontend-first deployment deadlock.

### Show baseline context as a summary, not repeated row content

Place a compact comparison banner above the compatibility counts. It names the current aggregate and renders the baseline as base schema, previous aggregate, or empty starting point. Show the draft revision in that context and retain the baseline content hash as secondary audit information rather than row-level noise.

### Correlate only exact latest reject decisions

Build a latest-decision map keyed by `candidateIdentity`, using sequence order to resolve multiple decisions. A diff item receives an “Explicitly rejected” provenance label only when its coordinate exactly matches a latest `REJECT` decision. Compatibility status remains visible as a separate label because intentional removals can still be breaking.

### Keep technical identifiers available but secondary

Use readable baseline labels first and show full identifiers in compact secondary text or technical details. This preserves auditability without making UUIDs the dominant explanation.

## Risks / Trade-offs

- [Backend fields are not available when frontend work begins] → Ship optional parsing and the honest unavailable fallback first; do not infer an ID.
- [Old frontend rejects the backend's additive fields because its parser is strict] → Coordinate rollout so the compatibility frontend is deployed before the backend response expansion.
- [The baseline ID names a mutable base-schema record but not its exact content] → Retain the backend-provided content hash in technical comparison context.
- [A related parent removal appears decision-driven but has no exact rejected coordinate] → Avoid heuristic attribution; show provenance only for exact latest-decision matches.
- [Decision history grows large] → Reuse the already-loaded list and build one memoized map rather than scanning it for every render.

## Migration Plan

1. Deploy frontend support for optional `draftRevision` and nested baseline metadata plus the unavailable fallback.
2. Add and deploy the backend `draftRevision` and `baseline` response fields in the backend repository.
3. Verify base-schema, previous-aggregate, and empty-baseline drafts in the UI.
4. Optionally tighten the frontend fields to required after incompatible backend versions are no longer supported.

## Open Questions

- Whether a later audit-focused change should replace exact frontend REJECT matching with authoritative backend per-item provenance.
