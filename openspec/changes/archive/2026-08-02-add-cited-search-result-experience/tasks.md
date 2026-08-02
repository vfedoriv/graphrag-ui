## 1. Guarded Result Loading

- [x] 1.1 Connect completed/partial focused runs to result fetching while keeping other terminal statuses lifecycle-only
- [x] 1.2 Integrate envelope/nested payload-version and version-one structural validation before semantic rendering
- [x] 1.3 Add explicit unsupported-version and malformed-result presentations with bounded collapsed raw diagnostic JSON
- [x] 1.4 Preserve focused run, draft, history, and lifecycle context across pre-result `409`, result `404`, transport, unsupported, and malformed failures

## 2. Answer and Reference Presentation

- [x] 2.1 Render answer status, readable text, confidence, limitations, and explicit insufficient-evidence/unavailable-answer states
- [x] 2.2 Render claim cards with kind, text, citation IDs, graph-fact IDs, and graph-evidence IDs without fabricating inline answer offsets
- [x] 2.3 Build typed evidence/citation/graph lookup maps that preserve server order and surface missing reference integrity warnings
- [x] 2.4 Render graph facts and resolve their evidence/citation references without silently substituting missing IDs

## 3. Evidence, Context, and Navigation

- [x] 3.1 Render ranked evidence with snapshot label/type, ranges, structural path, processing/effective revision, rank, score, and excerpt
- [x] 3.2 Render context-only entries separately and identify missing excerpts when evidence text was disabled or unavailable
- [x] 3.3 Implement source-label fallback from snapshot display label to snapshot filename, cached document filename, then document ID without blocking on document lookup
- [x] 3.4 Link citations with document/chunk identity to reload-safe Chunk Explorer URLs and render non-linkable citations when identity is incomplete
- [x] 3.5 Keep partial branch content visible alongside limitations and concise warning summaries

## 4. Diagnostics

- [x] 4.1 Add collapsed planning, sufficiency, follow-up, retriever-attempt, fusion, graph-expansion, parent-context, reranking, selection, and source-metadata diagnostic sections
- [x] 4.2 Add collapsed answer diagnostics and complete bounded raw JSON
- [x] 4.3 Surface concise fallback, source-warning, missing-reference, and partial-branch summaries without dominating primary results

## 5. Hybrid Search Retirement

- [x] 5.1 Remove Hybrid Search DTOs, raw API function, mutation hook, and endpoint-specific tests
- [x] 5.2 Remove Hybrid Search tab, form/result state, status summary, pending aggregation, copy, and workflow tests from Queries
- [x] 5.3 Remove stale Hybrid Search runtime-setting hints while leaving all advanced-search global tuning in generic Settings
- [x] 5.4 Update Queries regressions to assert exactly Ask, Generate Cypher, Validate Cypher, and Execute Cypher remain
- [x] 5.5 Add a regression assertion that no frontend request targets `/queries/hybrid-search`

## 6. Result Verification

- [x] 6.1 Add result tests for completed, partial, insufficient-evidence, unavailable-answer, unsupported, malformed, pre-result, expired, and missing-excerpt cases
- [x] 6.2 Add claim/evidence/graph reference tests including missing IDs, source snapshot labels, legacy fallbacks, and nullable metadata
- [x] 6.3 Add diagnostics collapse/raw JSON tests and verify no inline citation positions are fabricated
- [x] 6.4 Add citation-to-Chunking navigation tests and deterministic mocked Playwright result flow
- [x] 6.5 Run `npm run lint`, `npm run test:run`, `npm run coverage`, `npm run build`, and `npm run test:e2e`
