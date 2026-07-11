## Context

The application currently defines a single light palette as CSS custom properties in `src/index.css`, with a few literal light colors mixed into global rules. The shared `AppLayout` is the natural location for a user-facing appearance control, while theme initialization must happen before React mounts to prevent the initial light palette from flashing. This is a frontend-only preference and must not alter the GraphRAG API contract.

## Goals / Non-Goals

**Goals:**
- Support `light`, `dark`, and `system` preferences throughout every route.
- Resolve and apply the effective theme before first paint and keep it synchronized with system changes.
- Persist explicit user choice locally through a small, testable shared theme abstraction.
- Express both palettes through semantic CSS tokens so shared primitives and feature pages inherit consistent colors.
- Preserve accessible contrast and visible hover, pressed, disabled, and focus states.

**Non-Goals:**
- Synchronizing appearance through a backend account or across browsers.
- Adding more themes, per-page themes, or user-customizable colors.
- Redesigning layouts, typography, or application workflows.
- Changing backend APIs, authentication, or authorization.

## Decisions

### Use a three-value preference and a two-value resolved theme

Store `light | dark | system` as the user preference and derive `light | dark` as the effective theme. Apply the effective theme as `data-theme` on the document root and set `color-scheme` so native controls match. Keeping preference separate from resolution allows the UI to show “System” while the rendered palette follows the operating system.

Alternative considered: a binary toggle. It is simpler, but cannot preserve an explicit system-following choice and makes default behavior less clear.

### Initialize the document theme before React renders

Add a small inline bootstrap in the HTML entry (or an equivalently early module guaranteed to run before mount) that safely reads the stored preference, evaluates `prefers-color-scheme`, and sets the root theme. The React provider then adopts the same logic and owns subsequent updates. Storage and media-query failures fall back to `system` and a light resolved theme when no media result is available.

Alternative considered: initialize only in a React effect. Effects run after the first render and can cause a visible incorrect-theme flash.

### Centralize theme behavior in shared state

Introduce a shared theme provider/hook that exposes the preference, resolved theme, and setter. It owns persistence and subscribes to media-query changes only as needed for the system preference. `AppLayout` consumes it to render the shell control; feature code does not manage document attributes directly.

Alternative considered: manage state entirely inside `AppLayout`. That couples global document behavior to one component and makes bootstrap parity and isolated tests harder.

### Extend semantic tokens instead of scattering dark selectors

Keep existing semantic custom-property names and add any missing role-based tokens for controls, overlays, and interactive mixtures. Define the light values at `:root` and override them under `[data-theme='dark']`. Replace literal `white` and light-biased `color-mix()` inputs in production styling with semantic tokens. Components continue consuming roles such as surface, foreground, border, and accent rather than knowing which theme is active.

Alternative considered: add component-level dark-mode overrides. That would duplicate palette decisions and make omissions likely as the UI grows.

### Use an accessible segmented/select control in the shell

Place a labeled Light/System/Dark control in the sidebar context area so it is available on every route and remains usable in the stacked mobile shell. The control communicates its selected value programmatically and supports keyboard operation and visible focus.

Alternative considered: an icon-only sun/moon button. It is compact but does not expose the system option clearly and requires more interpretation.

## Risks / Trade-offs

- [A literal light color remains in a feature style] → Audit stylesheet color values, migrate them to semantic tokens, and add representative component/page checks in both themes.
- [Bootstrap and provider resolution diverge] → Share the storage key and resolution rules in a minimal module where feasible, and test identical input cases.
- [Storage or `matchMedia` is unavailable] → Guard browser APIs and fall back without preventing application startup.
- [Dark colors reduce status or focus contrast] → Validate key text, controls, status badges, output panels, and focus rings in both palettes.
- [Inline bootstrap tightens future CSP requirements] → Prefer an external early module if the deployment adopts a restrictive script policy; the current static deployment has no documented CSP constraint.

## Migration Plan

Ship the new tokens, bootstrap, provider, and control together. Existing users have no stored preference and therefore start in system mode. Rollback consists of removing the provider/control/bootstrap and dark token override; the preference key can remain harmlessly in local storage.

## Open Questions

None. The implementation can use the existing visual direction and choose exact dark token values during contrast verification.
