## Context

The current UI uses clickable labels as the visible affordance for choosing files in upload and file-driven schema generation flows. Users interpret these as static text rather than actions, which creates confusion and reduces task completion confidence.

## Goals / Non-Goals

**Goals:**
- Replace label-like file chooser affordances with clear button controls.
- Keep existing file parsing and API submission behavior unchanged.
- Apply the same interaction pattern across all file-select workflows.

**Non-Goals:**
- Backend endpoint or payload changes.
- Large visual redesign outside file-picker controls.
- Introducing drag-and-drop upload in this change.

## Decisions

1. Use explicit `Button` UI triggers that programmatically click hidden `input[type=file]` elements.
Rationale: preserves native file dialog behavior and accessibility while improving action discoverability.
Alternative considered: style labels as buttons; rejected because semantics remain less explicit and easy to regress.

2. Show selected filename/text-source state adjacent to the button.
Rationale: confirms action success before submit and reduces uncertainty.
Alternative considered: no visible selected-state feedback; rejected due to poor UX.

3. Reuse one small helper pattern for button+hidden-input wiring across pages.
Rationale: avoids repeated ad-hoc handling and keeps behavior consistent.
Alternative considered: per-page custom handlers only; rejected for duplication.

## Risks / Trade-offs

- [Risk] Button trigger may break keyboard/assistive flow if input association is lost. -> Mitigation: retain accessible input attributes and focus behavior.
- [Risk] Hidden input refs may introduce state bugs if not reset between picks. -> Mitigation: reset value where needed and cover with UI tests.
- [Trade-off] Slightly more code around refs/handlers. -> Mitigation: encapsulate in shared helper pattern.

## Migration Plan

1. Update Documents upload control to button-triggered selection.
2. Update schema generation “from file” controls to button-triggered selection.
3. Add/adjust tests to assert button presence and functional file chooser wiring.
4. Run lint/build/tests.

## Open Questions

- Should we also add drag-and-drop file zones in a follow-up?
