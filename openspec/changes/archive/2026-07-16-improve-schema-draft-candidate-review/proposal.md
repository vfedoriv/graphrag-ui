## Why

The Candidates workbench currently presents schema candidates as raw canonical identities and transport-shaped JSON, making routine review slow and difficult to understand. Candidate rows should prioritize the proposed schema element and the evidence signals that help an administrator decide, while keeping technical provenance available on demand.

## What Changes

- Replace tall transport-oriented candidate summaries with compact, human-readable review rows derived from each candidate kind and coordinates.
- Present analyzer recommendation and persistent review state as distinct, prominent signals without treating either recommendation or confidence as user approval.
- Describe `supportCount` accurately as the number of independent supporting sources, including clear zero, singular, and plural wording.
- Replace the always-visible candidate JSON dump with readable candidate details and progressively disclosed technical data.
- Simplify evidence presentation by emphasizing source, document, and chunk references while placing fingerprints and complete identifiers in technical details.
- Keep accept, reject, modify, and pin actions close to the candidate being reviewed, and make persisted decisions navigable to their history entry.
- Move append-only decision history into a secondary disclosure so it does not compete with the active review queue.
- Preserve paging, revision-aware decisions, contract-error handling, and the existing backend API contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Refine candidate review requirements around compact readable summaries, independent-source support semantics, progressive technical disclosure, evidence presentation, and decision-history navigation.

## Impact

- Affects the Candidates section in `src/features/schema-drafts/SchemaDraftsPage.tsx`, its feature-local presentation helpers, styles, fixtures, and workflow tests.
- Reuses the existing `CandidateResponse` and decision contracts; no backend endpoint or payload changes are required.
- May add shared or feature-local accessible disclosure and candidate-summary presentation primitives, using existing shared UI components where suitable.
