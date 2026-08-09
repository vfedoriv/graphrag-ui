## 1. Exclusive outline modes

- [x] 1.1 Derive explicit `EMPTY`, `FLAT`, and `HIERARCHICAL` Chunk Explorer modes from hierarchy parent totals and `flatChunkCount` without consulting current global strategy settings.
- [x] 1.2 Enable `kind=FLAT` paging only for `FLAT` mode, render parent summaries only for `HIERARCHICAL` mode, and avoid collection-page requests for `EMPTY` mode.
- [x] 1.3 Update outline status labels, headings, and empty states so the UI presents one document topology rather than simultaneous hierarchy and flat branches.

## 2. Integrity-conflict handling

- [x] 2.1 Recognize the backend RFC 7807 `409` detail `Document chunk topology is invalid` on the hierarchy request and render a dedicated document-integrity alert.
- [x] 2.2 Suppress child and flat collection navigation during a topology conflict while preserving already loaded authoritative direct detail and a bounded hierarchy refetch action.
- [x] 2.3 Preserve existing ownership-safe `404`, ordinary hierarchy/child/flat retry, deep-link, selected-detail, and knowledge-base reset behavior.

## 3. Contract and component coverage

- [x] 3.1 Replace mixed-success Explorer fixtures with separate pure-hierarchy, pure-flat fixed-character, and empty-document fixtures.
- [x] 3.2 Assert pure hierarchy never requests `kind=FLAT`, pure flat requests exact `kind=FLAT` and renders returned `CHILD`, and empty mode issues no page request.
- [x] 3.3 Add topology-conflict coverage proving no child/flat collection request occurs and direct detail remains visible when already loaded.
- [x] 3.4 Cover flat-to-hierarchy and hierarchy-to-flat replacement/invalidation transitions without stale outline mode or page data.
- [x] 3.5 Retain query-key isolation, direct flat selection, branch retry for valid modes, and compatibility complete-list route guards.

## 4. Verification and rollout

- [x] 4.1 Confirm backend change `enforce-exclusive-document-chunk-topology` is deployed and its database audit reports zero invalid documents.
- [x] 4.2 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
- [x] 4.3 Verify one recursive document and one fixed-character document through the running frontend, including direct chunk selection and absence of mixed outline UI.
