## 1. Documents Page

- [ ] 1.1 Extract document row action state and handlers into a feature-local workflow hook.
- [ ] 1.2 Move document source context, processing options workflow, and chunk inspector leaf components into feature-local files.
- [ ] 1.3 Add focused tests for overwrite fallback, per-row pending state, processing option draft preservation, and chunk metadata parsing.

## 2. Schemas Page

- [ ] 2.1 Extract schema list row actions and update/delete/detail workflow state into feature-local modules.
- [ ] 2.2 Split schema generation, validation, and creation panels into cohesive feature-local components.
- [ ] 2.3 Add or update tests for generated draft preservation, row actions, and validation/create failure behavior.

## 3. Settings Page

- [ ] 3.1 Move runtime settings filtering, draft parsing, apply, and clear behavior into feature-local modules.
- [ ] 3.2 Move AI profile form conversion and section behavior into feature-local modules.
- [ ] 3.3 Add focused tests for runtime value parsing, restart-required pending values, and profile payload conversion.

## 4. Schema Builder Page

- [ ] 4.1 Extract builder draft synchronization/import behavior into a feature-local hook.
- [ ] 4.2 Keep existing mapping and flow pure modules intact unless small exports are needed for testability.
- [ ] 4.3 Add or update tests for route import, session draft import, raw JSON parse failure, and create/update gating.

## 5. Verification

- [ ] 5.1 Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, and `npm run test:e2e`.
