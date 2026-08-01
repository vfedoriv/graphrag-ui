## ADDED Requirements

### Requirement: Frontend models authoritative chunking contracts
The system SHALL define typed frontend contracts for aggregate chunking state, complete document chunk provenance, metadata-only chunk summaries, bounded chunk pages and hierarchies, migration previews, and generalized reprocessing plans using the backend wire names and legacy nullability through backend commit `c5dc2a2`.

#### Scenario: Decode aggregate chunking state
- **WHEN** the chunking-state endpoint returns canonical values, value sources, component revisions, tokenizer/parser/representation metadata, settings hash, effective revision, migration lifecycle, and compatibility aliases
- **THEN** the frontend SHALL retain every field in a typed `ChunkingState` representation without deriving an alternative effective state

#### Scenario: Decode legacy chunk provenance
- **WHEN** a chunk response omits or returns null for provenance fields introduced after the chunk was stored
- **THEN** the frontend SHALL accept the response and preserve those fields as unavailable rather than supplying invented values

#### Scenario: Decode bounded chunk envelopes
- **WHEN** hierarchy or page endpoints return page, size, total elements, content, and hierarchy flat-chunk count
- **THEN** the frontend SHALL preserve the server paging envelope and distinguish metadata summaries from full chunk responses

#### Scenario: Decode generalized reprocessing resources
- **WHEN** preview, plan summary, plan detail, or item resources include reason, selection, expected chunker revision, target currency, retry lineage, or `BLOCKED_TARGET_CHANGED`
- **THEN** the shared frontend contract SHALL expose those fields and statuses to all reprocessing consumers

### Requirement: Frontend models versioned advanced-search contracts
The system SHALL define explicit typed contracts for readiness, create requests, run summary/detail, paged history, cancellation, result envelopes, and every version-one answer, claim, evidence, context, graph-fact, limitation, answer-diagnostic, and pipeline-diagnostic structure returned by the backend.

#### Scenario: Preserve retained run request context
- **WHEN** history returns `queryPreview`, `maximumEvidence`, and `includeEvidenceText`, or owned detail returns the full `query`
- **THEN** the typed frontend resources SHALL preserve those fields for reload-safe history and detail presentation

#### Scenario: Preserve nullable legacy source metadata
- **WHEN** version-one evidence or context has null `sourceDisplayLabel`, `sourceFilename`, `sourceContentType`, text, or provenance
- **THEN** the frontend contract SHALL accept the result while leaving those values explicitly unavailable

#### Scenario: Preserve typed diagnostics
- **WHEN** a version-one result includes planning, sufficiency, follow-up, retriever-attempt, fusion, graph-expansion, parent-context, reranking, selection, source-metadata, or answer diagnostics
- **THEN** the frontend SHALL expose the typed nested structures without reverse-engineering a generic JSON node

### Requirement: Advanced operational endpoints are reusable and exact
The system SHALL expose reusable raw API functions and TanStack Query hooks for the documented chunking, chunk-read, reprocessing, and advanced-search routes, and SHALL serialize request bodies and query parameters exactly as documented.

#### Scenario: Request bounded chunk data
- **WHEN** a consumer requests hierarchy, a filtered chunk page, or a direct chunk
- **THEN** the API module SHALL target `/documents/{documentId}/chunks/hierarchy`, `/documents/{documentId}/chunks/page`, or `/documents/{documentId}/chunks/{chunkId}` with only applicable paging and filter parameters
- **AND** new-workspace operations SHALL NOT target the compatibility complete-list chunk route

#### Scenario: Preview and create a migration
- **WHEN** a consumer previews or creates chunk migration work
- **THEN** preview SHALL use `/knowledge-bases/{knowledgeBaseId}/chunk-migrations/preview` with body selection, optional document IDs, and processing options
- **AND** creation SHALL use the shared reprocessing endpoint with reason, selection, expected chunker revision, and document IDs only for `DOCUMENT_IDS`

#### Scenario: Retry unresolved migration work
- **WHEN** a consumer retries an eligible plan
- **THEN** the request body SHALL be exactly `{ "mode": "RESNAPSHOT_UNRESOLVED" }`
- **AND** the frontend SHALL NOT emit the deprecated boolean compatibility field

#### Scenario: Use advanced-search run routes
- **WHEN** a consumer evaluates readiness, creates, lists, reads, fetches the result of, or cancels an advanced-search run
- **THEN** the API module SHALL use the owned `/knowledge-bases/{knowledgeBaseId}/queries/advanced-search-runs` route family and preserve paging/status parameters

#### Scenario: Omit blank evidence maximum
- **WHEN** advanced-search submission has a blank maximum-evidence draft
- **THEN** the JSON payload SHALL omit `maximumEvidence` and SHALL send `includeEvidenceText` using that exact property name

### Requirement: Query keys isolate operational resource identity
The system SHALL provide stable query-key factories whose identities include every knowledge-base, document, resource, paging, and server-filter parameter that can change a returned advanced-operation resource.

#### Scenario: Cache filtered migration history
- **WHEN** reason, selection, status, page, or size differs between history requests
- **THEN** each request SHALL have a distinct stable query key

#### Scenario: Cache chunk outline branches
- **WHEN** hierarchy page, flat page, parent ID, child page, section filter, or direct chunk ID differs
- **THEN** each chunk resource SHALL have a distinct document-scoped query key

#### Scenario: Cache advanced-search resources
- **WHEN** readiness, history filters/pages, run detail, or result is requested for a knowledge base
- **THEN** query keys SHALL separate those resource kinds and include the owning knowledge-base ID

#### Scenario: Required identifier is missing
- **WHEN** a query lacks a required knowledge-base, document, run, plan, or chunk ID
- **THEN** its hook SHALL use a stable disabled key and SHALL NOT invoke the endpoint

### Requirement: Polling and result admission are deterministic
The system SHALL provide shared status helpers so focused non-terminal advanced-search runs poll every 1.5 seconds, focused active reprocessing plans poll while non-terminal, and advanced-search result requests enable only for `COMPLETED` or `PARTIAL`.

#### Scenario: Focused advanced-search run is active
- **WHEN** the focused run status is non-terminal
- **THEN** its detail hook SHALL refetch at a 1.5-second interval

#### Scenario: Advanced-search run becomes terminal
- **WHEN** the focused run enters any terminal status
- **THEN** detail polling SHALL stop
- **AND** result fetching SHALL become enabled only for `COMPLETED` or `PARTIAL`

#### Scenario: Reprocessing plan becomes terminal
- **WHEN** the focused reprocessing plan enters a terminal status
- **THEN** plan-detail polling SHALL stop while its paged items remain inspectable

### Requirement: Versioned result failures remain diagnosable
The system SHALL check both advanced-search result envelope and nested payload versions and SHALL distinguish supported version-one results, unsupported versions, and malformed supported-version payloads while retaining raw response JSON for diagnosis.

#### Scenario: Supported versions match
- **WHEN** both payload-version fields equal 1 and the required version-one structure is valid
- **THEN** the API boundary SHALL return the typed `AdvancedSearchResultV1`

#### Scenario: Envelope and result versions differ
- **WHEN** envelope and nested payload versions do not match
- **THEN** the API boundary SHALL return an explicit unsupported/malformed result state and raw diagnostic JSON instead of coercing either version

#### Scenario: Version-one structure is malformed
- **WHEN** both versions equal 1 but required answer or reference structures are malformed
- **THEN** the API boundary SHALL return a malformed-result state with raw diagnostic JSON
