## 1. Explorer State and Layout

- [ ] 1.1 Add the Chunk Explorer view to the Chunking workspace and parse/normalize `documentId` and `chunkId` search parameters
- [ ] 1.2 Add active-knowledge-base document selection with explicit no-selection, loading, error, unprocessed, and empty-document states
- [ ] 1.3 Build a responsive paged outline/detail layout using shared UI primitives
- [ ] 1.4 Clear incompatible document/chunk URL state and scoped caches on knowledge-base change with an explanatory notice

## 2. Bounded Hierarchy and Flat Paging

- [ ] 2.1 Load a bounded metadata-only hierarchy page and render parent summaries, page totals, and flat-chunk count
- [ ] 2.2 Implement per-parent lazy expansion with independent bounded child paging, branch errors, retries, and empty-page states
- [ ] 2.3 Implement bounded flat fallback paging for hierarchy-free documents and expose both populations for mixed documents
- [ ] 2.4 Render concise page/source range, section, structural path, child-count, token, and revision fields without loading summary text
- [ ] 2.5 Ensure outline navigation never concatenates all pages or calls the compatibility complete-list route

## 3. Direct Selection and Provenance

- [ ] 3.1 Fetch every selected chunk through the direct route and render authoritative text plus all available provenance and raw metadata
- [ ] 3.2 Handle nullable legacy provenance with explicit unavailable states and no inferred values
- [ ] 3.3 Resolve deep-linked child chunks direct-first, then load/expand their parent and a bounded child page when discoverable
- [ ] 3.4 Preserve off-page direct selections and provide bounded reveal/navigation guidance without scanning every outline page
- [ ] 3.5 Distinguish ownership-safe/not-found direct errors from hierarchy, child-page, flat-page, and transport errors

## 4. Documents Handoff

- [ ] 4.1 Replace Documents `View chunks` actions and inline inspector state with `Inspect chunking` links carrying the selected document ID
- [ ] 4.2 Remove inline complete-list chunk queries, readable/raw inspector components, related state, and obsolete tests
- [ ] 4.3 Preserve upload, processing, processing options, source context, replacement, deletion, and row-specific pending behavior
- [ ] 4.4 Invalidate bounded/direct chunk query roots after processing, replacement, or deletion

## 5. Explorer Verification

- [ ] 5.1 Add API/component tests for bounded parent paging, child paging, flat fallback, mixed documents, direct detail, and branch errors
- [ ] 5.2 Add deep-link tests for parent, child, flat, off-page parent, invalid ownership, reload, and knowledge-base changes
- [ ] 5.3 Add provenance/legacy-null/empty/unprocessed tests and assert no request targets the complete-list chunk route
- [ ] 5.4 Add deterministic Playwright coverage with mocked `/api/v1` hierarchy, page, direct, and document responses
- [ ] 5.5 Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, and `npm run test:e2e`
