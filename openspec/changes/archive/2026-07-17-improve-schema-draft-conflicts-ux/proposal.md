## Why

The Schema Drafts workbench presents conflicts as wide, form-heavy blocks with raw JSON details and an always-visible custom editor, making it difficult to understand the required decision and causing each conflict to consume excessive vertical and horizontal space. The conflict review experience should guide users toward one clear resolution at a time while keeping evidence and advanced input available when needed.

## What Changes

- Replace the full-width, always-expanded conflict forms with a compact review queue that clearly separates unresolved and resolved conflicts.
- Present each conflict with a readable coordinate, human-friendly conflict type, status, and concise instruction describing what the user needs to decide.
- Keep conflict details, evidence, and resolution controls collapsed until the user chooses to review a conflict.
- Provide an explicit resolution mode: select one backend-provided alternative or enter a custom structured value, without displaying both inputs simultaneously.
- Show backend alternatives as readable choices instead of requiring selection from an unexplained generic dropdown.
- Constrain the active resolution content to a readable maximum width and use responsive behavior for narrower screens.
- Preserve read-only inspection of resolved and published conflicts, including the chosen resolution returned by the backend.
- Add focused interaction and layout tests for conflict review, resolution-mode switching, validation, and read-only states.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-review-ui`: Change conflict presentation and resolution requirements to provide a compact, guided, progressively disclosed review workflow while preserving explicit alternative-or-custom resolution semantics.

## Impact

- Affects the conflict section of `src/features/schema-drafts/SchemaDraftsPage.tsx`, its feature tests, and supporting styles in `src/index.css`.
- May introduce feature-local presentation helpers or components for conflict summaries, readable alternative values, and resolution controls.
- Does not change backend endpoints, request/response DTOs, query invalidation behavior, or authentication scope.
