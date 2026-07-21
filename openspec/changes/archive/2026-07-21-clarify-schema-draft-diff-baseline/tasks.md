## 1. Prepare the diff contract rollout

- [x] 1.1 Confirm the backend-owned `DiffResponse` contract uses optional-during-rollout `draftRevision` and a `baseline` descriptor with `type`, nullable `id`, and `contentHash`.
- [x] 1.2 Extend the frontend diff DTO and strict Zod schema with optional `draftRevision` and baseline metadata so both pre-expansion and expanded backend responses parse during rollout.
- [x] 1.3 Update diff fixtures with base-schema, previous-aggregate, empty, and temporarily unavailable baseline variants.

## 2. Explain the comparison and change provenance

- [x] 2.1 Add a compact Diff summary that names the current aggregate, draft revision, and backend-selected baseline type and identifier without implying the active schema is the baseline.
- [x] 2.2 Add the honest baseline-unavailable fallback and preserve the existing diff when metadata is absent.
- [x] 2.3 Build an exact latest-decision lookup by candidate identity and label only exact-coordinate latest `REJECT` matches as explicitly rejected.
- [x] 2.4 Retain the baseline content hash as secondary audit information and keep compatibility status visually and semantically separate from decision provenance, including at narrow viewport widths.

## 3. Add regression coverage

- [x] 3.1 Add API validation tests for the nested expanded and rollout-compatible diff responses while retaining strict rejection of unrelated fields.
- [x] 3.2 Add Diff rendering tests for all baseline types, unavailable metadata, exact reject provenance, and non-matching related coordinates.
- [x] 3.3 Add or update responsive assertions for baseline and provenance content without clipping or eager before/after rendering.

## 4. Validate the change

- [x] 4.1 Run focused schema-draft API and Diff page tests.
- [x] 4.2 Run `npm run lint`, `npm run test:run`, and `npm run build`.
