## Why

The Properties page currently mixes general backend runtime configuration with AI provider settings and AI profile CRUD, making two different administrative concerns harder to scan and manage. A dedicated AI Providers page will colocate provider-related properties and profiles while leaving Properties focused on the rest of the runtime catalog.

## What Changes

- Add a primary-navigation page named **AI Providers** with its own route.
- Move the AI profiles section from Properties to AI Providers without changing the backend profile contract or secret-handling behavior.
- Show AI provider-related runtime properties on AI Providers and remove them from the Properties catalog.
- Keep provider-related properties read-only when the backend marks them sensitive, profile-managed, or otherwise non-editable, and preserve their backend metadata and status.
- Update links and contextual guidance so provider-managed settings lead to AI Providers and non-provider workflow settings continue to lead to Properties.
- Split page-level tests so each page verifies its own loading, error, filtering, profile-management, and setting-placement behavior.

## Capabilities

### New Capabilities

- `ai-providers-page`: Provides a dedicated navigable workspace that combines AI provider runtime properties with AI profile management.

### Modified Capabilities

- `runtime-properties-management`: Changes the Properties catalog to exclude AI provider-related settings and routes provider-management guidance to the dedicated AI Providers page.
- `ai-profile-management-ui`: Changes AI profile listing, errors, and management flows from the Properties page to the dedicated AI Providers page.

## Impact

- Affects application routing and primary navigation in `src/app`.
- Refactors the existing settings feature into separate Properties and AI Providers page compositions while reusing runtime-setting and AI-profile UI behavior.
- Updates page-level filtering/link behavior and related tests in `src/features/settings` or a new provider-focused feature directory.
- Updates workflow links or labels that currently send users to Settings/Properties for provider-managed configuration.
- Continues to consume `/api/v1/runtime-settings` and `/api/v1/ai-profiles`; no backend contract, authentication, or dependency changes are required.
