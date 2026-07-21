## 1. Align evaluation eligibility contracts

- [x] 1.1 Add explicit readiness and ineligibility-reason unions, including `DRAFT_ANALYSIS_REQUIRED`, to the release response types.
- [x] 1.2 Add required `readiness` and nullable `blockingReason` fields plus strict enum validation to the eligibility Zod schema.
- [x] 1.3 Update the shared ready eligibility fixture and add a not-ready analysis-required variant.

## 2. Render authoritative eligibility state

- [x] 2.1 Add an exhaustive reason-to-message mapping for active discovery evidence and required draft analysis.
- [x] 2.2 Show draft-wide `NOT_READY` guidance from `blockingReason` and disable every eligibility checkbox and evaluation start while the page is not ready.
- [x] 2.3 Render each ineligible document's actual backend reason instead of unconditional discovery-evidence copy.
- [x] 2.4 Require ready page state, a fresh authority snapshot, a current aggregate, and at least one selected eligible document before starting evaluation.

## 3. Add regression coverage

- [x] 3.1 Add API-level coverage proving the expanded ready eligibility response passes strict parsing and preserves readiness fields.
- [x] 3.2 Add workflow coverage for selectable ready documents and correct active-discovery explanations.
- [x] 3.3 Add workflow coverage for an analysis-required page, disabled controls, and accurate page and row explanations.

## 4. Validate the change

- [x] 4.1 Run focused schema-draft release API and workflow tests.
- [x] 4.2 Run `npm run lint`, `npm run test:run`, and `npm run build`.
