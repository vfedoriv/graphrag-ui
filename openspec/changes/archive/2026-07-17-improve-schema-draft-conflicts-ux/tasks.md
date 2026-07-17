## 1. Conflict Presentation

- [x] 1.1 Add feature-local helpers that safely humanize conflict types, summarize arbitrary alternatives and evidence, and preserve exact backend alternative identifiers.
- [x] 1.2 Replace generic conflict notices with a compact review queue that orders unresolved conflicts before resolved conflicts and exposes readable status and action guidance.
- [x] 1.3 Add a focused conflict item that keeps resolution controls collapsed by default, allows only one active unresolved workflow, and separates evidence and technical payload disclosures.

## 2. Resolution Workflow

- [x] 2.1 Add an accessible resolution-mode choice between suggested and custom values and render only the active mode's controls.
- [x] 2.2 Present backend alternatives as keyboard-selectable readable choices and submit the exact selected identifier with the current draft revision.
- [x] 2.3 Integrate the custom structured editor, optional rationale, mode-switch clearing, disabled confirmation rules, defensive JSON validation, pending state, and existing mutation feedback.
- [x] 2.4 Render resolved and published conflicts as compact read-only records showing the selected or custom resolution returned by the backend without mutation controls.

## 3. Responsive Styling

- [x] 3.1 Add conflict-specific queue, summary, option, disclosure, and active-panel styles with a readable maximum width and without changing shared notice or form behavior.
- [x] 3.2 Add responsive rules that prevent horizontal overflow and stack conflict actions and option content at narrow viewport widths.

## 4. Verification

- [x] 4.1 Add tests proving collapsed conflicts are compact, unresolved items precede resolved items, and inactive conflicts do not render editors or complete evidence payloads.
- [x] 4.2 Add interaction tests for opening one workflow at a time, switching modes, clearing inactive values, validating custom JSON, and sending exactly one resolution path.
- [x] 4.3 Add tests for resolved and published read-only states plus safe rendering of array, object, scalar, and null alternative or evidence shapes.
- [x] 4.4 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`, fixing any regressions caused by the change.
- [x] 4.5 Verify the expanded conflict workflow in a real browser and confirm radio controls retain compact native dimensions.
