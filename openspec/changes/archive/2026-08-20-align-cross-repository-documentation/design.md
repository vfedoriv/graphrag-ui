## Context

The frontend README describes only the earlier knowledge-base, schema, document, query, and settings surface even though the router now also exposes the schema builder, schema drafts, chunking, advanced search, and AI-provider workflows. The repository already has substantial Advanced Search and Chunking guides with screenshots and backend details, but README does not link to them and their source maps use machine-local repository paths.

The coordinated backend change `add-multipage-documentation-portal` establishes `graphrag` as the canonical cross-stack documentation owner. This frontend change must preserve the useful full deep dives while clarifying ownership and providing stable two-way navigation. It must not change UI behavior or introduce another documentation site.

## Goals / Non-Goals

**Goals:**

- Make every current routed frontend workflow discoverable from README.
- Link README and deep dives to the canonical backend portal and relevant canonical workflow pages.
- Keep the existing Advanced Search and Chunking explanations, screenshots, caveats, and frontend implementation maps complete.
- Replace public-facing machine-local paths with stable repository URLs.
- Keep overlapping workflow and documentation guidance synchronized across README, `AGENTS.md`, and `CLAUDE.md`.
- Deterministically verify local documentation and image targets through the existing frontend test toolchain.

**Non-Goals:**

- Hosting or generating the canonical documentation portal in this repository.
- Removing or reducing the existing deep dives to pointer-only pages.
- Automatically copying content from the backend repository.
- Changing frontend routes, API contracts, controls, dependencies, or runtime behavior.
- Fetching external URLs during deterministic tests.

## Decisions

### Treat the backend portal as canonical and frontend guides as complete companion copies

README links first to the canonical backend portal, then to local UI-oriented guides. Each Advanced Search and Chunking overview/reference page receives a short ownership notice near the top: the backend portal owns canonical system behavior, while the local document remains a complete frontend companion with screenshots, UI behavior, observed caveats, and implementation locations.

Alternative: move the detailed guides to the backend. Rejected because the user chose to retain full copies and the screenshots/source maps are most maintainable beside the UI.

### Use stable branch URLs for cross-repository navigation

Cross-repository links target the `main` branch:

- Portal index: `https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/index.md`
- Canonical Advanced Search flow: `https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/workflows/advanced-search.md`
- Canonical Chunking/Reprocessing flow: `https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/workflows/chunking-reprocessing.md`

Links within `graphrag-ui` remain relative Markdown paths. Public-facing documentation no longer uses `/home/vitaliy/workspace/...` as a repository reference; implementation tables use repository-relative code paths or stable GitHub links.

Alternative: use cross-repository relative filesystem paths. Rejected because they work only for one side-by-side local checkout layout and fail on GitHub.

### Make README the frontend documentation index

README retains setup, scripts, structure, proxying, Docker, and validation guidance, but its workflow inventory is updated from the actual router. A Documentation section links to:

- the canonical backend portal and runtime Swagger/OpenAPI guidance;
- local Advanced Search overview/reference pages;
- local Chunking overview/reference pages;
- the testing gap report.

### Preserve full copies and make drift visible

The existing deep-dive content is not mechanically synchronized with backend pages. Each guide retains a verification date and identifies the paired canonical page. During implementation, current caveats and source maps are rechecked against both repositories; stale statements are corrected or removed.

### Validate local references with the existing test stack

Add a focused Vitest test using Node's built-in filesystem APIs and no new dependency. It scans README plus `docs/**/*.md`, ignores fenced-code examples and external/mail/anchor-only URLs, verifies every relative document/image target exists, and asserts the required canonical backend URLs and local guide links are present. Normal `npm run test:run` executes the check.

## Risks / Trade-offs

- [Full cross-stack copies can drift] → Mark canonical ownership, retain verification dates, and make reciprocal links and link tests part of normal documentation maintenance.
- [Links to `main` may not resolve before coordinated changes merge] → Apply and merge the backend portal first or merge both changes as a coordinated pair; use the agreed final paths in both proposals.
- [A link test cannot prove external content correctness] → Test stable URL strings and local targets deterministically; review external targets during implementation without making CI network-dependent.
- [README can become another long manual] → Keep it as an index and development guide, linking deep behavior to local guides and the backend portal.

## Migration Plan

1. Update README workflow inventory and add the Documentation index.
2. Add ownership notices and reciprocal canonical links to Advanced Search and Chunking overview/reference pages.
3. Recheck verification dates, caveats, screenshots, and implementation maps against current code.
4. Align contributor guidance and replace machine-local public references.
5. Add and run the deterministic documentation-link test after the backend portal paths exist.

Rollback is a documentation/test revert; there is no runtime or data migration.

## Open Questions

None. Automatic prose synchronization and a frontend-hosted site are intentionally out of scope.
