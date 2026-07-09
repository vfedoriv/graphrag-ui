## 1. Enable Strict TypeScript

- [x] 1.1 Enable `strict` in `tsconfig.app.json`.
- [x] 1.2 Enable `strict` in `tsconfig.node.json`.
- [x] 1.3 Resolve strict-mode type errors without broad `any` conversions or blanket suppressions.

## 2. Ratchet Coverage

- [x] 2.1 Raise Vitest coverage thresholds to at least statements 80, branches 70, functions 78, and lines 82.
- [x] 2.2 Add targeted tests for any files or branches that fall below the ratcheted threshold.
- [x] 2.3 Keep generated coverage output out of source changes.

## 3. Verification

- [x] 3.1 Run `npm run lint`.
- [x] 3.2 Run `npm run test:run`.
- [x] 3.3 Run `npm run coverage`.
- [x] 3.4 Run `npm run build`.
