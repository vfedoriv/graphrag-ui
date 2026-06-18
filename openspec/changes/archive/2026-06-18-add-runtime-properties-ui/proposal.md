## Why

The backend now exposes allowlisted runtime application settings and AI profile APIs, but the frontend Settings page still shows only static proxy information. Operators need a UI to inspect live configuration, safely edit mutable settings, reset overrides, and understand when provider-related properties must be managed through AI profiles instead of runtime setting updates.

## What Changes

- Replace the static Settings/Properties runtime section with a runtime settings catalog backed by `/api/v1/runtime-settings`.
- Add runtime setting controls for filtering by category/update mode, inspecting current/default/source/constraints, updating live-mutable values, clearing persisted overrides, and showing read-only or restart-required reasons.
- Preserve sensitive-value safety by rendering masked/configured indicators without exposing or accepting secret values through runtime settings forms.
- Add AI profile management UI backed by `/api/v1/ai-profiles` for listing, creating, updating, deleting, and displaying write-only API key state.
- Add knowledge-base active AI profile assignment using the new knowledge base AI profile endpoints and the `activeAiProfileId` field.
- Surface active AI profile and relevant live runtime settings context on pages where it affects behavior, especially schema generation, document processing, and query workflows.

## Capabilities

### New Capabilities
- `runtime-properties-management`: Frontend users can inspect and manage backend runtime application settings according to backend update semantics.
- `ai-profile-management-ui`: Frontend users can manage OpenAI-compatible AI profiles and understand provider settings that are profile-managed.

### Modified Capabilities
- `knowledge-base-management`: Knowledge bases expose and update active AI profile assignment alongside active schema/workspace context.

## Impact

- Affected frontend areas: `src/api`, `src/features/settings`, `src/features/knowledge-bases`, contextual workspace displays in schema/document/query pages, shared UI primitives as needed, and tests.
- Backend API dependencies: `/api/v1/runtime-settings`, `/api/v1/ai-profiles`, `/api/v1/knowledge-bases/{knowledgeBaseId}/ai-profile`, and `KnowledgeBase.activeAiProfileId`.
- No backend contract changes are expected from this frontend change.
