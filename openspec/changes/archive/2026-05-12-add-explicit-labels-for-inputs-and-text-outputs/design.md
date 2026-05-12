## Context

The UI currently uses placeholders extensively, and some output blocks are unlabeled `pre` regions. This causes ambiguity about field purpose and weakens accessibility semantics. The change should apply consistently to standalone inputs/textareas/output blocks while preserving concise table interactions.

## Goals / Non-Goals

**Goals:**
- Ensure every standalone input/textarea has an attached, purpose-describing label.
- Ensure standalone text output blocks have descriptive labels/headings.
- Preserve the exception for input controls embedded within table rows/cells.

**Non-Goals:**
- Redesigning visual theme or component architecture.
- Replacing table-based inline editing patterns.
- Backend/API behavior changes.

## Decisions

1. Prefer semantic `<label>` elements linked to inputs (`htmlFor`/`id`) for standalone fields.
Rationale: improves accessibility and clarifies intent.
Alternative considered: placeholder-only guidance; rejected due to ambiguity.

2. Add concise heading/label text immediately before output previews (`pre` blocks).
Rationale: users understand what data the output represents.
Alternative considered: leaving outputs unlabeled; rejected for discoverability.

3. Keep table-embedded input exception; rely on table headers/row context there.
Rationale: avoids visual clutter in dense tabular UIs while preserving context.
Alternative considered: label every table input; rejected as noisy.

## Risks / Trade-offs

- [Risk] More labels may increase vertical space usage. -> Mitigation: use compact label text and spacing utilities.
- [Risk] Inconsistent label wording across pages. -> Mitigation: use shared naming conventions and review checklist.
- [Trade-off] Slightly more markup in feature components. -> Mitigation: centralize reusable labeled-field wrappers where practical.

## Migration Plan

1. Identify standalone inputs/textareas/output blocks across feature pages.
2. Add attached labels and output descriptors, excluding table-embedded fields.
3. Update tests to assert key label presence.
4. Run lint/build/tests.

## Open Questions

- Should output labels follow a fixed wording pattern (for example “Result”, “Generated output”, “Validation output”) documented in shared UI guidelines?
