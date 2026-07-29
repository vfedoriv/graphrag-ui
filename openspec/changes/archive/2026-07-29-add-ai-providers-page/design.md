## Context

The `/settings` controller currently owns three concerns: general runtime properties, AI provider-related runtime properties, and AI profile CRUD. Runtime properties come from one backend-owned `/api/v1/runtime-settings` catalog, while profiles come from `/api/v1/ai-profiles`. Provider settings are already distinguishable through runtime metadata: the current catalog uses the `provider` category, and profile-owned entries use the `PROFILE_MANAGED` update mode.

The split crosses routing, primary navigation, page composition, runtime-setting selection, profile-management placement, contextual links, and page tests. It must preserve backend-owned editability and sensitivity rules, keep API keys write-only, and avoid changing either backend endpoint.

## Goals / Non-Goals

**Goals:**

- Give AI provider configuration a dedicated `/ai-providers` route and primary navigation entry.
- Colocate provider-related runtime properties and AI profile management on that page.
- Keep non-provider runtime properties on Settings/Properties.
- Define provider-setting placement once so a setting cannot appear on both pages or silently disappear.
- Reuse existing API hooks and section components, including their loading, mutation, secret, and error behavior.
- Update contextual guidance and tests to reflect the new ownership boundary.

**Non-Goals:**

- No backend API, DTO, authentication, or authorization changes.
- No new provider types or provider-specific profile schemas.
- No change to knowledge-base AI profile assignment.
- No change to runtime setting mutability, restart, clear, or sensitivity semantics.
- No redesign of the profile CRUD forms or the generic runtime-setting table.

## Decisions

### Classify provider properties with a shared metadata predicate

Add a single helper that treats a runtime setting as AI-provider-related when its normalized category is `provider` or its normalized update mode is `PROFILE_MANAGED`. The AI Providers page receives settings matching this predicate; Properties receives the exact complement.

This uses backend metadata rather than key-name matching, keeps the partition exhaustive, and covers profile-managed provider entries even if their category is incomplete. The helper will be unit-tested for category casing, profile-managed fallback, unrelated settings, and complement behavior.

Alternative considered: match key prefixes such as `openai.`. That would couple the frontend to current provider names and fail as new OpenAI-compatible providers or keys are introduced.

### Add a sibling route instead of tabs within Settings

Register a lazy-loaded `/ai-providers` page and add **AI Providers** to primary navigation. Keep `/settings` as the existing Properties/control-plane destination, but remove AI profile queries and provider-setting rendering from its page composition.

A sibling route gives provider administration a stable link target and makes its ownership visible in primary navigation. Existing controller-page primitives, workspace context, and section components remain reusable.

Alternative considered: retain one route and add Properties/AI Providers tabs. That would leave navigation and deep-link semantics coupled to the mixed Settings page the change is intended to separate.

### Compose the new page from existing sections

The AI Providers page will load runtime settings, AI profiles, and the selected knowledge-base context. It will render the provider subset through `RuntimeSettingsSection` and render the existing `AiProfilesSection` immediately alongside it. The section components retain their existing API mutations, editability checks, secret handling, and feedback.

Properties will render `RuntimeSettingsSection` with only the non-provider subset. Counts, category filters, empty states, and apply behavior therefore operate only on settings owned by the current page.

Alternative considered: duplicate provider-specific property rows inside `AiProfilesSection`. That would fork runtime editor behavior and validation while both views still use the same backend catalog.

### Point provider guidance at the route-level owner

Provider-managed property guidance on the AI Providers page will continue to target the colocated profile section. Any cross-page provider-management link will target `/ai-providers` (optionally with the profile-section fragment), while generic workflow runtime-setting links remain directed to `/settings`.

This keeps deep links correct after the split and avoids sending users to a page where the referenced setting or profile no longer appears.

### Separate page tests while retaining component coverage

Move profile CRUD expectations into AI Providers page tests and adjust Settings page tests to assert that provider properties and profiles are absent. Add placement tests using a mixed runtime catalog to prove provider entries appear only on AI Providers and other entries appear only on Properties. Router/navigation tests will verify the new destination, and existing section/helper tests will continue to cover edits and secret safety.

Alternative considered: update only existing snapshots or text assertions. That would not protect the critical partition against duplication or omission.

## Risks / Trade-offs

- [Backend introduces provider settings without provider metadata] → Document and test the metadata contract; render such entries on Properties until the backend categorizes them rather than guessing from keys.
- [A profile-managed setting is not AI-provider-related in the future] → Keep the predicate centralized so the classification rule can be narrowed without page rewrites.
- [Both pages fetch the full runtime catalog] → Accept the small duplicate request when navigating between routes; TanStack Query caching shares the same query key and avoids unnecessary network work while data remains fresh.
- [Existing links or tests still assume profiles live on Settings] → Search all route, label, fragment, and page-test references and cover both destinations explicitly.
- [The Properties name differs from the current Settings route/title] → Preserve the existing `/settings` URL and visible naming unless a separate product decision requests a rename; this change only establishes the AI Providers page.

## Migration Plan

1. Add the classification helper and its tests.
2. Add the AI Providers page, route, and navigation item using existing queries and sections.
3. Filter Settings/Properties to the non-provider complement and remove its profile section/query.
4. Update provider-management links and split page-level tests.
5. Run the full frontend validation set.

The change is frontend-only and requires no data migration. Rollback consists of removing the route/navigation entry and restoring the former combined Settings page composition.

## Open Questions

None. The existing backend metadata and API contracts are sufficient for implementation.
