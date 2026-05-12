## Why

Buttons currently provide minimal visual response on hover and click, making interactions feel unresponsive and reducing user confidence that actions were triggered. We need consistent interactive feedback now so button states are clear and predictable across the app.

## What Changes

- Add consistent visual hover, focus-visible, and pressed/active states to application buttons.
- Ensure disabled buttons remain visually distinct and non-interactive.
- Apply interaction feedback to default and variant button styles used across controller pages.
- Add regression coverage to verify button state classes/behavior remain present.

## Capabilities

### New Capabilities
- `interactive-button-state-feedback`: Standardized hover, focus, and press interaction feedback for all shared UI buttons.

### Modified Capabilities
- `admin-app-shell-and-navigation`: Shared shell interactions adopt the updated button feedback model used across pages.

## Impact

- Affected code: `src/shared/ui/Button.tsx`, potentially related shared style utilities, and component tests that render buttons.
- No backend/API contract changes.
- UI tests may require updates for interaction state assertions.
