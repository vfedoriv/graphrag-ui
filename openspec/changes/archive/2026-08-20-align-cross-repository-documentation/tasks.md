## 1. Refresh the frontend documentation entry point

- [x] 1.1 Update README's workflow inventory from the current router, including schema builder, schema drafts, chunking, advanced search, and AI providers
- [x] 1.2 Add a README Documentation section linking the canonical backend portal, local Advanced Search and Chunking overview/reference pages, and testing guidance
- [x] 1.3 Replace the machine-local backend reference with the stable backend repository and canonical portal URLs

## 2. Align Advanced Search documentation

- [x] 2.1 Add canonical-backend ownership notices and reciprocal links to the Advanced Search overview and reference pages
- [x] 2.2 Reverify Advanced Search controls, lifecycle descriptions, screenshots, caveats, and source maps against the current frontend and backend implementations
- [x] 2.3 Replace public-facing machine-local source references with repository-relative paths or stable GitHub URLs

## 3. Align Chunking documentation

- [x] 3.1 Add canonical-backend ownership notices and reciprocal links to the Chunking overview and reference pages
- [x] 3.2 Reverify Chunking controls, processing/reprocessing behavior, screenshots, known compatibility notes, and source maps against the current frontend and backend implementations
- [x] 3.3 Replace public-facing machine-local source references with repository-relative paths or stable GitHub URLs

## 4. Synchronize contributor guidance

- [x] 4.1 Update `AGENTS.md` with the current workflow inventory, canonical documentation ownership, local deep-dive locations, and coordinated maintenance expectations
- [x] 4.2 Update `CLAUDE.md` wherever its architecture, workflow, or documentation guidance overlaps the refreshed README and `AGENTS.md`

## 5. Validate documentation references

- [x] 5.1 Add a dependency-free Vitest documentation test that validates README and `docs/**/*.md` relative document/image targets and required canonical links
- [x] 5.2 Run `npm run test:run` and confirm the documentation test participates in the normal suite
- [x] 5.3 Run `npm run lint` and `npm run build` to confirm the documentation-test addition preserves frontend validation
- [x] 5.4 Manually review all reciprocal links after the backend portal paths from `add-multipage-documentation-portal` exist on the coordinated branch
