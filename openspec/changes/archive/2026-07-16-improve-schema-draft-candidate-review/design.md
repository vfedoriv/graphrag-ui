## Context

The Candidates section currently renders each `CandidateResponse` in a generic `<details className="notice">`. Its summary is the canonical identity plus enum kind, support count, and confidence. Expansion adds badges, the entire serialized DTO, an evidence table dominated by UUIDs and fingerprints, decision controls, and a full decision-history table below the queue.

The backend already returns the fields needed for a readable presentation. Candidate kind and coordinate fields describe the proposed schema element, while recommendation, review state, origins, confidence, and support describe why it needs attention. Backend aggregation defines `supportCount` as the number of distinct independent sources: document evidence is deduplicated by `documentId`, other source types by `sourceId`, and multiple chunks from one source do not increase the count.

This is a frontend-only refinement. The existing API contract, paging model, revision-aware mutations, and prohibition against synthesizing unavailable source text remain authoritative.

## Goals / Non-Goals

**Goals:**

- Make a page of candidates fast to scan and compare.
- Translate transport fields into readable schema definitions for every candidate kind.
- Surface the minimum information needed for a review decision before expansion.
- Explain independent-source support accurately.
- Preserve complete provenance and payload inspection through progressive disclosure.
- Keep recommendation state independent from persisted user review state.
- Make an existing decision traceable from its candidate to decision history.
- Preserve accessible keyboard and disclosure behavior.

**Non-Goals:**

- Changing candidate, evidence, decision, or paging backend contracts.
- Adding backend filtering, sorting, bulk decisions, or automatic acceptance.
- Inventing source names, excerpts, or semantic evidence not returned by the backend.
- Redesigning the other workbench sections.
- Changing the meaning of confidence, recommendation, review state, modify, or pin.

## Decisions

### Derive a readable primary description from typed candidate coordinates

Use candidate kind to select a stable presentation:

| Kind | Primary description | Supporting value |
| --- | --- | --- |
| `NODE` | node label | `Node` |
| `NODE_PROPERTY` | `Label.property` | property type |
| `NODE_KEY` | `Label key: key1, key2` | `Identity key` |
| `RELATIONSHIP` | `From —[TYPE]→ To` | `Relationship` |
| `RELATIONSHIP_PROPERTY` | `TYPE.property` with endpoints available in details | property type |

The canonical identity remains available in technical details and continues to be used as the React key and decision identity. When an original coordinate differs from its normalized coordinate, render an explicit `original → proposed` change.

The alternative was parsing the canonical identity string. Typed fields are safer because the identity is a transport key and coordinate fields are already part of the validated contract.

### Use a compact disclosure row with two information levels

The collapsed row contains the readable definition, user-facing kind, recommendation, review state, origins, independent-source count, and analyzer confidence. Styling targets approximately 52–60 pixels for a normal desktop row while allowing wrapping at narrow widths; tests SHALL assert content and behavior rather than exact pixel height.

Expansion reveals readable field details, evidence references, rationale, and decision actions. Complete JSON, full fingerprints, and transport-oriented identifiers move under a nested `Technical details` disclosure. Candidate evidence continues to render only for expanded candidates, preserving the current lazy rendering behavior.

The alternative was a dense table. A disclosure list better accommodates five candidate shapes, responsive layouts, evidence, and inline decisions without creating many sparse or conditional columns.

### Describe support as independent sources

Render positive values as `Supported by 1 independent source` or `Supported by N independent sources`. Render zero as `No observed source support`, while keeping origin badges visible so guided or inferred candidates remain explainable. A short collapsed form such as `1 source` is acceptable when the nearby context or accessible label communicates independent support.

Do not derive the count from `evidence.length`: one document can contribute several chunk evidence records while counting as one independent source.

### Keep analyzer and user state visually independent

Recommendation and effective review state use separately labelled badges or groups. Recommendation tones communicate analyzer attention (`RECOMMENDED`, `LOW_SUPPORT`, `REVIEW_REQUIRED`, `SUPPRESSED`) but do not reuse wording that implies a user decision. Review state communicates `Unreviewed`, `Accepted`, `Rejected`, `Modified`, or `Pinned` independently. Confidence is labelled `Analyzer confidence` and displayed as a formatted percentage when present.

The alternative was a single composite status. That would obscure whether a state came from analysis or a persisted decision and contradict the existing contract.

### Keep decision controls local and history secondary

Accept, reject, modify, and pin remain associated with the expanded candidate to prevent accidental actions while scanning. The optional rationale stays adjacent to those actions. Existing mutation ownership, pending states, revision refresh, and 409 handling are unchanged.

Wrap append-only decision history in a collapsed disclosure below the paged queue. A candidate with `latestDecisionId` exposes a control that opens history and navigates or focuses the matching row. Use stable DOM identifiers or equivalent focus management without putting decision IDs in the primary candidate summary.

The alternative was always showing the full history table. It consumes substantial space and competes with the active task while providing little value until a prior decision is inspected.

### Extract presentation logic from the workbench controller

Implement candidate title, kind label, support text, confidence formatting, and rename detection as small pure feature-local helpers. Render the candidate review item as a feature-local component rather than further expanding the already broad `SchemaDraftsPage` controller. Reuse shared `Button`, `StatusBadge`, `Input`, `Table`, and structured payload components where their semantics fit.

Pure helpers allow complete candidate-kind and wording coverage without coupling tests to the full workbench request flow.

## Risks / Trade-offs

- [Opaque evidence references remain weak decision evidence because the backend returns no source names or excerpts] → Prioritize their provenance relationship, keep complete identifiers available, and do not invent semantic context.
- [A 52–60 pixel target may not hold with long coordinates, localization, or narrow viewports] → Allow wrapping and treat density as a desktop design target rather than a fixed height.
- [Recommendation color can still be mistaken for approval] → Label the dimension explicitly and keep it spatially separate from review state.
- [Frontend-only filters would misleadingly cover only the loaded page] → Do not add review filters or global counts in this change.
- [Moving JSON behind disclosure can inconvenience debugging] → Retain the complete payload unchanged under technical details.
- [Programmatic history navigation can be inaccessible if it only scrolls visually] → Expand history, move keyboard focus to the matching entry, and preserve a descriptive control label.

## Migration Plan

1. Add pure candidate-presentation helpers and their unit tests for every candidate kind and support-count state.
2. Introduce the compact candidate review item and progressive evidence/technical disclosures.
3. Add decision-history disclosure and latest-decision navigation.
4. Update workflow fixtures and interaction tests, then validate lint, tests, coverage, and production build.
5. Verify density, wrapping, focus behavior, and decision flows in light and dark themes at desktop and narrow widths.

Rollback is limited to restoring the previous candidate renderer; no persisted data or backend migration is involved.

## Open Questions

None. Backend source confirms the independent-source semantics of `supportCount`, and the existing typed payload supports the proposed presentation without a contract change.
