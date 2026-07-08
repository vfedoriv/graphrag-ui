## 1. Enable Strict TypeScript

- [ ] 1.1 Enable `strict` in `tsconfig.app.json`.
- [ ] 1.2 Enable `strict` in `tsconfig.node.json`.
- [ ] 1.3 Resolve strict-mode type errors without broad `any` conversions or blanket suppressions.

## 2. Ratchet Coverage

- [ ] 2.1 Raise Vitest coverage thresholds to at least statements 80, branches 70, functions 78, and lines 82.
- [ ] 2.2 Add targeted tests for any files or branches that fall below the ratcheted threshold.
- [ ] 2.3 Keep generated coverage output out of source changes.

## 3. Verification

- [ ] 3.1 Run `npm run lint`.
- [ ] 3.2 Run `npm run test:run`.
- [ ] 3.3 Run `npm run coverage`.
- [ ] 3.4 Run `npm run build`.
