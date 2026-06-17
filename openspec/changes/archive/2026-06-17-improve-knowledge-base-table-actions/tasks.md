## 1. Knowledge Bases Table UI

- [x] 1.1 Replace default editable name inputs in the table with read-only name content.
- [x] 1.2 Add row-scoped Edit, Save, and Cancel controls for renaming a knowledge base.
- [x] 1.3 Ensure unchanged save and cancel paths do not send update requests.
- [x] 1.4 Preserve update pending and failure feedback for explicit rename requests.

## 2. Delete Confirmation

- [x] 2.1 Add a confirmation step before sending a knowledge base delete request.
- [x] 2.2 Include warning copy that deleting a knowledge base deletes all related data.
- [x] 2.3 Ensure canceling confirmation does not delete or change selected knowledge base state.
- [x] 2.4 Preserve selected-state clearing only after successful deletion of the selected knowledge base.

## 3. Visual Consistency and Copy

- [x] 3.1 Normalize Knowledge Bases table row action button sizing, spacing, and alignment.
- [x] 3.2 Remove the sentence "Mutations update the visible list and keep selection state honest." from the page description.
- [x] 3.3 Keep existing create, select, active schema display, loading, empty, pending, and error states intact.

## 4. Tests and Validation

- [x] 4.1 Update Knowledge Bases tests for explicit edit/save/cancel rename behavior.
- [x] 4.2 Add tests for delete confirmation confirm and cancel paths.
- [x] 4.3 Update tests that assumed every name cell is an input.
- [x] 4.4 Run `npm run lint`, `npm run test:run`, and `npm run build`.
