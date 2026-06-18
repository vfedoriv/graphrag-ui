## 1. API Contracts

- [x] 1.1 Add runtime setting, AI profile, and profile assignment DTO types in `src/api/types.ts`, including `KnowledgeBase.activeAiProfileId`.
- [x] 1.2 Add `src/api/runtimeSettings.ts` with list, update, clear, query, and mutation hooks using `/runtime-settings`.
- [x] 1.3 Add `src/api/aiProfiles.ts` with list, get, create, update, delete, query, and mutation hooks using `/ai-profiles`.
- [x] 1.4 Extend `src/api/knowledgeBases.ts` with active AI profile get/update calls and invalidation for knowledge base/profile context.
- [x] 1.5 Extend `src/api/queryKeys.ts` and query key tests for runtime settings, AI profiles, and knowledge-base active profile keys.

## 2. Runtime Properties UI

- [x] 2.1 Replace the static Settings runtime section with a runtime settings catalog that loads `/api/v1/runtime-settings`.
- [x] 2.2 Render setting metadata, values, defaults, constraints, sensitivity, source, live-applied state, update mode, and reasons using existing shared UI primitives.
- [x] 2.3 Add category, update-mode, and text filtering while preserving row metadata needed for editability decisions.
- [x] 2.4 Implement value editors for boolean, numeric, string, and JSON-like runtime setting values.
- [x] 2.5 Implement update and clear actions for mutable live settings with row-scoped pending, success, and normalized error feedback.
- [x] 2.6 Disable or omit edit/clear actions for read-only, restart-required, profile-managed, and sensitive runtime settings, and show backend-provided reasons.
- [x] 2.7 Render sensitive runtime setting values only as masked/configured backend-provided status.

## 3. AI Profile Management UI

- [x] 3.1 Add an AI profiles section to Settings/Properties that lists profile metadata and API key configured/masked state.
- [x] 3.2 Implement create profile form with backend validation feedback.
- [x] 3.3 Implement profile edit flow for non-secret fields without submitting displayed masks as API keys.
- [x] 3.4 Add explicit API key replace and clear controls for profile updates.
- [x] 3.5 Implement confirmed profile deletion and refresh profile plus knowledge-base context after success.
- [x] 3.6 Link profile-managed runtime settings to the AI profile management section instead of offering runtime setting edits.

## 4. Knowledge Base AI Profile Assignment

- [x] 4.1 Display `activeAiProfileId` in knowledge base rows, selected workspace metadata, and relevant page workspace strips.
- [x] 4.2 Add a Knowledge Bases page assignment control that lists existing AI profiles for a row or selected knowledge base.
- [x] 4.3 Submit `{ profileId }` to `/knowledge-bases/{knowledgeBaseId}/ai-profile` and refresh knowledge base/profile context after success.
- [x] 4.4 Surface assignment errors inline and keep the previous active profile visible on failure.

## 5. Workflow Context Summaries

- [x] 5.1 Show active AI profile context on schema generation/example workflows.
- [x] 5.2 Show active AI profile plus relevant chunking/extraction runtime settings on document processing workflows.
- [x] 5.3 Show active AI profile plus relevant query safety/hybrid search runtime settings on query workflows.
- [x] 5.4 Ensure workflow summaries degrade cleanly when runtime settings or profile data are unavailable.

## 6. Tests and Validation

- [x] 6.1 Add API tests for runtime settings list/update/clear payloads and error handling.
- [x] 6.2 Add API tests for AI profile CRUD payloads, delete handling, and write-only API key update behavior.
- [x] 6.3 Update knowledge base API and page tests for `activeAiProfileId` display and assignment invalidation.
- [x] 6.4 Add Settings page tests for catalog filtering, editable vs read-only states, sensitive value rendering, update, clear, and backend errors.
- [x] 6.5 Add Settings page tests for AI profile create/edit/delete and profile-managed setting guidance.
- [x] 6.6 Update workflow/page tests for active profile and runtime setting context summaries.
- [x] 6.7 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
