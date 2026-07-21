## 1. Discovery Evidence Clarity

- [x] 1.1 Update the draft-private file form heading, action label, accessible name, and persistent explanatory copy to identify the upload as discovery evidence that stays outside Documents and cannot be held out
- [x] 1.2 Extend source-workflow tests to verify the discovery-evidence warning is visible before upload while the existing draft file-source request behavior remains unchanged

## 2. Held-Out Evaluation Handoff

- [x] 2.1 Add concise held-out selection guidance and a `/documents` link to the Release evaluation stage, plus an emphasized current-page state when the loaded eligibility rows are all ineligible
- [x] 2.2 Preserve eligibility rows, backend reasons, pagination, selection rules, and the disabled Start action while adding return instructions that distinguish normal documents from draft sources
- [x] 2.3 Extend Release workflow tests for the Documents link, all-ineligible guidance, eligible selection, and unchanged evaluation payload behavior

## 3. Validation

- [x] 3.1 Run focused schema-draft tests and inspect the Sources and Release guidance in the browser at representative desktop and mobile widths
- [x] 3.2 Run lint, the one-shot test suite, and the production build; resolve any regressions introduced by the copy and navigation changes
