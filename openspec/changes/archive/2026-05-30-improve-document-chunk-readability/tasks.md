## 1. Chunk Inspector UI

- [x] 1.1 Add local readable/raw JSON mode state for the selected document chunk output.
- [x] 1.2 Render readable mode by default after chunks load successfully.
- [x] 1.3 Add mode controls that switch between `Readable view` and `Raw JSON` without changing the selected document or refetching chunks.
- [x] 1.4 Render one readable section per chunk with chunk index, id, token estimate when available, source metadata when available, and wrapped whitespace-preserving text.
- [x] 1.5 Keep readable chunks and raw JSON output bounded with internal scrolling so large output does not destabilize page layout.

## 2. Tests

- [x] 2.1 Update Documents page tests to assert readable chunk view is the default after `View chunks`.
- [x] 2.2 Add coverage for chunk metadata and wrapped text rendering in readable mode.
- [x] 2.3 Add coverage for switching to raw JSON mode and back to readable mode.
- [x] 2.4 Verify mode switching does not trigger a new chunk fetch solely due to the mode change.

## 3. Validation

- [x] 3.1 Run targeted Documents page tests.
- [x] 3.2 Run `npm run lint`.
- [x] 3.3 Run `npm run test:run`.
