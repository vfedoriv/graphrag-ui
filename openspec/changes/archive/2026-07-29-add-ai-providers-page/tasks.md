## 1. Provider Property Partition

- [x] 1.1 Add a shared runtime-setting predicate that classifies provider settings by case-insensitive `provider` category or `PROFILE_MANAGED` update mode.
- [x] 1.2 Add unit tests for category-based, profile-managed, case-normalized, non-provider, and exhaustive complement classification.

## 2. AI Providers Page

- [x] 2.1 Create the AI Providers controller page using the existing runtime settings, AI profiles, selected knowledge base, and shared UI primitives.
- [x] 2.2 Render only provider-classified runtime settings and the existing AI profiles management section on the AI Providers page, preserving independent loading and error states.
- [x] 2.3 Register a lazy-loaded `/ai-providers` route and add the **AI Providers** primary navigation item with active-route behavior.
- [x] 2.4 Update provider-management links and profile-section fragments to resolve to the AI Providers route while retaining `/settings` links for non-provider runtime edits.

## 3. Properties Page Separation

- [x] 3.1 Filter Settings/Properties to the non-provider runtime-setting complement before rendering the catalog.
- [x] 3.2 Remove the AI profiles query and management section from Settings/Properties and adjust its page copy, status, and workspace summary to describe only its remaining concerns.
- [x] 3.3 Ensure counts, filters, empty states, edits, clears, restart messaging, sensitivity, and errors continue to operate on the page-owned setting subset.

## 4. Page and Navigation Tests

- [x] 4.1 Update Settings/Properties tests to verify non-provider behavior and assert that provider properties and AI profile management are absent.
- [x] 4.2 Add AI Providers page tests for provider-only placement, category/update-mode/text filtering, independent load failures, non-editable provider metadata, and empty states.
- [x] 4.3 Move or recreate AI profile create, edit, replace-key, clear-key, delete, validation, and failure coverage under the AI Providers page.
- [x] 4.4 Add router or application-shell coverage for direct `/ai-providers` access, primary-navigation selection, and active destination state.
- [x] 4.5 Update affected workflow/link tests to distinguish provider edits routed to `/ai-providers` from other runtime edits routed to `/settings`.

## 5. Validation

- [x] 5.1 Run `npm run lint` and resolve any lint failures.
- [x] 5.2 Run `npm run test:run` and resolve any test failures.
- [x] 5.3 Run `npm run coverage` and confirm configured thresholds remain satisfied.
- [x] 5.4 Run `npm run build` and resolve any TypeScript or production build failures.
