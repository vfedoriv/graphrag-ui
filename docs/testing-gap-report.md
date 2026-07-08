# Testing Gap Report

## Current Baseline

This report tracks the frontend validation baseline and known quality gaps for GraphRAG UI.

As of the guardrails repair change, the normal substantial-change validation set is:

- `openspec validate --all`
- `npm run lint`
- `npm run test:run`
- `npm run test:e2e`
- `npm run coverage`
- `npm run build`

## Priority Gaps

- Keep Playwright mocks aligned with current `/api/v1` requests made by covered routes.
- Keep browser selectors based on roles, labels, and stable `data-testid` values rather than obsolete markup classes.
- Add focused tests when extracting controller workflow state from large feature pages.
- Ratchet coverage thresholds after the guardrails and behavior-preserving refactors are green.

## Notes

Generated coverage output remains under `coverage/` and is not source documentation.
