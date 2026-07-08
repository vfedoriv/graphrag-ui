## 1. Repair OpenSpec And Documentation

- [x] 1.1 Add valid `## Purpose` sections to current specs missing them.
- [x] 1.2 Convert current spec files that still use change-delta headers into current-spec `## Requirements` format.
- [x] 1.3 Replace stale YAML wording in current README, AGENTS guidance, and active specs with JSON schema workflow wording.
- [x] 1.4 Resolve stale documentation references to missing quality reports by restoring the report or updating the references.

## 2. Repair Browser E2E Guardrails

- [x] 2.1 Update Playwright app-shell assertions to current headings, workspace strip text, and accessible navigation behavior.
- [x] 2.2 Replace obsolete implementation-specific selectors with role, label, and `data-testid` selectors where practical.
- [x] 2.3 Add deterministic `/runtime-settings` and `/ai-profiles` mocks for Settings route coverage.
- [x] 2.4 Re-run failed browser workflows and update remaining stale expectations without weakening unexpected-request failures.

## 3. Verification

- [x] 3.1 Run `openspec validate --all` and confirm all specs and active changes pass.
- [x] 3.2 Run `npm run test:e2e` and confirm all browser tests pass.
- [x] 3.3 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
