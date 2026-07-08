## Why

The project currently has stale quality guardrails: `npm run test:e2e` fails against current UI markup and mocked API coverage, and `openspec validate --all` fails because two current specs are not in current-spec format. Documentation and current specs also still contain YAML-era wording after the schema workflows migrated to JSON.

## What Changes

- Repair OpenSpec current-spec formatting so the full spec set validates.
- Update browser E2E mocks and selectors to match the current app shell, controller pages, Settings API calls, and accessible UI text.
- Remove stale YAML references from current user/developer documentation and active specs.
- Restore the documented validation baseline without changing backend API contracts or product behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `test-coverage-and-quality-governance`: project quality guardrails must include green OpenSpec validation and trustworthy documentation references.
- `browser-e2e-test-coverage`: browser tests must stay aligned with current UI markup and all API calls made by covered routes.
- `schema-json-migration-governance`: current docs and specs must consistently present schema workflows as JSON-only.

## Impact

- Affected artifacts: `openspec/specs/**`, `README.md`, `AGENTS.md`, and E2E tests/mocks under `e2e/`.
- Affected validation: `openspec validate --all`, `npm run test:e2e`, and the existing lint/test/build/coverage commands.
- APIs/dependencies: no backend API contract changes and no new runtime dependency expected.
