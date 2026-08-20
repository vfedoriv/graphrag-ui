## ADDED Requirements

### Requirement: Frontend README exposes the implemented application and documentation
The frontend repository SHALL maintain README as an accurate development entry point and documentation index for the currently routed application workflows.

#### Scenario: Reader reviews implemented workflows
- **WHEN** a reader opens the frontend README
- **THEN** the documented workflow inventory includes knowledge bases, schemas, schema builder, schema drafts, documents, chunking, advanced search, queries, AI providers, and settings
- **AND** each documentation link identifies whether the frontend or backend repository owns the target material

#### Scenario: Reader looks for detailed documentation
- **WHEN** a reader uses the README documentation index
- **THEN** the reader can reach the canonical backend portal, local Advanced Search overview/reference, local Chunking overview/reference, and testing guidance

### Requirement: Frontend deep dives remain complete companion documentation
The frontend repository SHALL retain complete Advanced Search and Chunking deep dives with their screenshots, UI behavior, cross-stack explanations, caveats, and implementation maps while identifying the backend portal as canonical for system behavior.

#### Scenario: Reader opens a frontend deep dive
- **WHEN** a reader opens an Advanced Search or Chunking overview or reference page
- **THEN** the page contains a canonical-backend ownership notice and a link to the corresponding backend workflow page
- **AND** the page retains its frontend controls, screenshots, caveats, and source-map material

#### Scenario: Deep dive is refreshed
- **WHEN** the coordinated documentation change is implemented
- **THEN** verification dates, observed caveats, implementation paths, and screenshots are reviewed against the current frontend and backend
- **AND** stale claims are corrected or removed

### Requirement: Cross-repository documentation links are stable and reciprocal
Public-facing frontend documentation SHALL use stable GitHub URLs for backend repository targets and relative paths for documents and assets owned by the frontend repository.

#### Scenario: Reader follows a backend reference
- **WHEN** frontend documentation links to the canonical portal, Advanced Search flow, or Chunking/Reprocessing flow
- **THEN** the target points to the agreed `main`-branch backend Markdown path
- **AND** the link does not depend on a machine-local `/home/...` checkout path

#### Scenario: Backend links back to frontend guidance
- **WHEN** the coordinated backend documentation is complete
- **THEN** its relevant workflow pages link back to the frontend deep dives for UI controls, screenshots, caveats, and implementation maps

### Requirement: Contributor guidance identifies documentation ownership
The frontend repository SHALL keep overlapping workflow inventories and documentation-maintenance guidance consistent across README, `AGENTS.md`, and `CLAUDE.md`.

#### Scenario: Contributor updates a documented workflow
- **WHEN** a frontend workflow or its relationship to a backend contract materially changes
- **THEN** the affected local guide and contributor guidance are updated together
- **AND** canonical backend behavior is changed through the coordinated backend repository rather than redefined locally

### Requirement: Frontend documentation references are tested
The frontend test suite SHALL deterministically validate local Markdown document and image targets and the presence of required canonical backend references without fetching external URLs.

#### Scenario: Local documentation target is missing
- **WHEN** README or a file under `docs/` references a missing relative document or image
- **THEN** the frontend documentation test fails with the source file and invalid target

#### Scenario: Canonical navigation is removed
- **WHEN** required backend portal or local deep-dive links are absent
- **THEN** the frontend documentation test fails during `npm run test:run`
