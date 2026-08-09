## 1. Typed bounded chunk-page contract

- [x] 1.1 Add request-only `ChunkPageKind` and `ChunkPageFilters` types for `PARENT`, `CHILD`, and `FLAT` while preserving nullable/string-compatible response `DocumentChunk.kind`.
- [x] 1.2 Apply the shared filter type to `documentsApi.chunkPage` and `useDocumentChunkPageQuery`, preserving page, size, parent, and section serialization.
- [x] 1.3 Apply the same kind type to chunk-page query-key factories and retain distinct identities for `FLAT`, `CHILD`, parent, section, page, and size filters.

## 2. Chunk Explorer contract coverage

- [x] 2.1 Add API serialization coverage proving the flat request is exactly `kind=FLAT` and that returned flat records remain represented as `kind=CHILD` with no parent ID.
- [x] 2.2 Add query-key coverage proving `FLAT` and `CHILD` pages cannot share cache identities, including their existing document, page, size, parent, and section dimensions.
- [x] 2.3 Preserve or extend Explorer coverage for mixed hierarchy and flat populations, independent flat-page failure/retry, and direct selection of an unparented child while its bounded page loads.
- [x] 2.4 Assert that the Explorer continues to avoid the compatibility complete-list chunk route.

## 3. Verification and rollout readiness

- [x] 3.1 Update frontend capability delta specs and API fixtures to document the virtual selector, canonical response kind, and backend dependency on `2c4527b`.
- [x] 3.2 Run `npm run lint`, `npm run test:run`, `npm run coverage`, and `npm run build`.
- [x] 3.3 Verify a fixed-character document through the running frontend after backend `2c4527b`, and verify mixed-population compatibility through canonical automated fixtures because the supported processing workflow cannot create that topology.
