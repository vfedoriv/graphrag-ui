## Context

The current `Conflicts` view maps every conflict to a generic full-width notice. Each unresolved item immediately renders a select, a seven-row JSON editor, rationale input, and submit button. The screenshot demonstrates that a single conflict occupies most of the viewport and the repeated controls make a multi-conflict queue difficult to scan. Alternatives and evidence are exposed together as transport-oriented JSON, while the user receives little explanation of the decision.

The backend already supplies all required conflict data and accepts exactly one `selectedAlternative` or `customResolution` with the current draft revision. This is a presentation and interaction change; the API contract and mutation lifecycle remain fixed. `alternatives` and `evidence` are intentionally typed as `unknown`, so the UI must degrade safely for arrays, keyed objects, scalar values, and unexpected structured content.

## Goals / Non-Goals

**Goals:**

- Make unresolved conflicts scannable as a compact queue with status and decision-relevant context visible at a glance.
- Explain the required action in plain language and focus the user on one conflict-resolution workflow at a time.
- Reveal only the selected resolution path and defer evidence and raw payloads until requested.
- Keep selected values, custom JSON validation, optional rationale, revision-aware mutation behavior, and post-mutation refresh semantics intact.
- Present resolved and published conflicts as compact, inspectable records without mutation controls.
- Maintain usable density and readable line lengths on wide screens while adapting to narrow viewports.

**Non-Goals:**

- Changing conflict detection, conflict types, alternative generation, evidence content, or backend contracts.
- Adding bulk or automatic conflict resolution.
- Persisting unfinished local form state across navigation or reloads.
- Inventing explanations from source text or metadata that the backend does not provide.

## Decisions

### Use a feature-local review queue and conflict item

`Conflicts` will remain the data-owning section and will organize unresolved items before resolved items. A feature-local conflict review item will own presentation and per-item disclosure, while section-level state will track the active conflict and draft input maps. This follows the established Candidates review-queue pattern without forcing conflict-specific behavior into shared UI primitives.

An unresolved item summary will show a readable coordinate, a humanized conflict type, an unresolved status badge, and a concise instruction. A resolved item will show its resolved status and chosen resolution summary. Opaque IDs and raw timestamps will not dominate the summary.

Alternative considered: keep generic `.notice` blocks and only reduce spacing. This would reduce size but would not solve unclear hierarchy, competing resolution paths, or raw-data-first presentation.

### Expand one focused conflict workflow at a time

Resolution controls will be collapsed by default. Selecting Review opens the chosen conflict and closes another active unresolved item. Local inputs remain keyed by conflict ID, so closing an item does not erase work during the current mount. Evidence and technical payloads remain separate disclosures within the active item.

Alternative considered: independent HTML `details` elements. They are simpler, but allow many large editors to remain open and recreate the page-height problem visible in the screenshot.

### Make resolution mode explicit

The active workflow will first ask the user to choose between `Use a suggested value` and `Enter a custom value`. Only the controls for that mode will render:

- Suggested mode presents backend alternatives as selectable options with readable value previews and preserves the exact backend alternative key/value submitted today.
- Custom mode presents the structured JSON editor and its format action.

Switching modes clears the inactive resolution value so the payload cannot contain both paths. Optional rationale remains secondary. The confirmation button stays disabled until the active mode contains a valid choice; submission still performs defensive exactly-one validation and JSON parsing.

Alternative considered: retain the select and editor simultaneously. This exposes all capabilities but visually implies both may be required and consumes most of each conflict card.

### Separate readable summaries from technical details

Small scalar alternatives will render directly. Structured alternatives will receive a compact formatted preview with a technical JSON disclosure when their shape cannot be represented safely as a simple label. Evidence will show a concise count or availability summary where possible, with the complete backend payload behind `Evidence details`. The UI will humanize known-style enum labels by replacing separators and applying sentence casing, while retaining the original value for submission and technical inspection.

Because the DTO fields are `unknown`, formatting helpers must be total functions: null, arrays, objects, primitives, and unsupported shapes must render without throwing. The UI will not assign domain meaning beyond labels available in the payload.

### Constrain content width without wasting the workbench canvas

The queue and active panel will use a conflict-specific maximum readable width rather than stretching editors and text across the entire workbench. Cards will remain fluid up to that maximum and become full width below it. On wide screens, unused horizontal space is intentional because it improves scanning and input readability; controls will not be stretched solely to fill the section.

CSS will use feature classes rather than altering `.notice`, `.stack`, or shared form styles globally. Responsive rules will stack summary actions and option content when space is limited.

### Preserve accessibility and mutation feedback

The active trigger will expose expanded state and its controlled panel. Resolution modes will use native radio semantics or an equivalent labeled control group, alternatives will be keyboard-selectable, validation will be associated with the active editor, and pending state will disable duplicate submission. Existing `MutationError` handling remains visible at section level. After success, query invalidation remains owned by `useSchemaDraftWorkflowMutations` and the refreshed conflict state determines whether the item moves into the resolved group.

## Risks / Trade-offs

- [Humanizing arbitrary conflict types can produce imperfect wording] → Preserve the original type in technical details and use a deterministic fallback formatter.
- [Unknown alternative shapes may not support attractive option cards] → Use safe compact JSON previews and retain a technical disclosure instead of assuming a schema.
- [Closing the active item can hide an unfinished resolution] → Preserve per-conflict local input state for the mounted section and signal the item that currently has draft input.
- [A maximum width leaves empty space on very wide screens] → Treat readable density as intentional and keep the container fluid on smaller screens.
- [Resolved responses do not expose submitted rationale] → Show only resolution fields returned by the backend; do not imply that rationale can be audited from this response.
