## Purpose

This specification defines the version-safe, citation-aware presentation of Advanced Search results in the GraphRAG admin UI.

## Requirements

### Requirement: Terminal result rendering is version-safe
The system SHALL fetch advanced-search results automatically only for `COMPLETED` or `PARTIAL` runs and SHALL render semantic content only after both envelope and nested payload versions are supported and the version-one structure is valid.

#### Scenario: Completed run has valid version-one result
- **WHEN** both payload versions equal 1 and required structures are valid
- **THEN** the workspace SHALL render the typed result

#### Scenario: Partial run has valid version-one result
- **WHEN** a `PARTIAL` run returns a valid version-one result
- **THEN** the workspace SHALL render available answer/evidence content
- **AND** SHALL identify the run as partial and expose branch limitations/failures

#### Scenario: Payload version is unsupported
- **WHEN** either payload version is not 1 or versions disagree
- **THEN** the workspace SHALL show an explicit unsupported-result state
- **AND** SHALL retain the raw diagnostic JSON in a collapsed section

#### Scenario: Supported payload is malformed
- **WHEN** versions equal 1 but required answer, collection, or reference structures are malformed
- **THEN** the workspace SHALL show a malformed-result state describing the validation failure
- **AND** SHALL not attempt best-effort semantic coercion

### Requirement: Answer states are readable and honest
The system SHALL present answer status, answer text, confidence, limitations, and claims as primary content and SHALL distinguish answered, insufficient-evidence, and answer-unavailable outcomes.

#### Scenario: Answer is available
- **WHEN** result answer status indicates an answer and text is present
- **THEN** the workspace SHALL display readable answer text, confidence level/score, and limitations

#### Scenario: Evidence is insufficient
- **WHEN** answer status or diagnostics indicate insufficient evidence or abstention
- **THEN** the workspace SHALL show an explicit insufficient-evidence presentation
- **AND** SHALL retain returned evidence and limitations for inspection

#### Scenario: Answer is unavailable
- **WHEN** answer text is absent or status indicates unavailable output
- **THEN** the workspace SHALL show an answer-unavailable state rather than an empty answer panel

#### Scenario: Claims are returned
- **WHEN** the answer includes claims
- **THEN** each claim SHALL render as a separate card with its kind, text, and citation/graph-reference chips

#### Scenario: No citation offsets exist
- **WHEN** claims cite evidence but the backend provides no answer segment or character offsets
- **THEN** the frontend SHALL NOT insert or fabricate inline citation positions inside answer text

### Requirement: Evidence and contexts preserve source traceability
The system SHALL render ranked evidence separately from context-only entries and SHALL show available source label/type, source/page ranges, structural path, processing/effective revision, rank, score, and returned excerpt.

#### Scenario: Ranked evidence is returned
- **WHEN** result evidence contains entries
- **THEN** the workspace SHALL preserve backend ranking and label citation ID, source context, ranges, structural path, revision, score, and excerpt

#### Scenario: Context-only entries are returned
- **WHEN** result contexts contain entries
- **THEN** they SHALL render in a separate context section
- **AND** SHALL not be presented as ranked evidence claims unless referenced as such by the backend

#### Scenario: Evidence text was disabled or missing
- **WHEN** an entry has no returned text
- **THEN** the workspace SHALL show that the excerpt was not included
- **AND** SHALL retain its citation and provenance metadata

#### Scenario: Legacy source metadata is nullable
- **WHEN** snapshotted display label, filename, or content type is unavailable
- **THEN** the label SHALL fall back in order to source filename, already-cached current document filename, and document ID
- **AND** document-list failure SHALL not block result rendering

### Requirement: Claims and graph facts resolve references explicitly
The system SHALL resolve claim citation IDs, graph-fact IDs, graph-evidence IDs, and graph-fact citation/evidence IDs against typed result collections while preserving server ordering.

#### Scenario: Claim cites ranked evidence
- **WHEN** a claim references a known citation ID
- **THEN** its chip SHALL navigate or focus the corresponding evidence entry

#### Scenario: Graph fact is returned
- **WHEN** result graph facts contain evidence or citation references
- **THEN** the graph-fact section SHALL show those references and their resolved evidence/citation relationships

#### Scenario: Reference target is missing
- **WHEN** a claim or graph fact references an unknown ID
- **THEN** the workspace SHALL surface a result-integrity warning
- **AND** SHALL not silently associate it with another entry

### Requirement: Citations deep-link to authoritative chunk inspection
The system SHALL link an evidence or context citation with both document and chunk IDs to `/chunking?view=chunks&documentId={documentId}&chunkId={chunkId}`.

#### Scenario: Citation has document and chunk identity
- **WHEN** the user activates its chunk-inspection action
- **THEN** navigation SHALL preserve the selected knowledge base and open the Chunk Explorer direct lookup URL

#### Scenario: Citation lacks chunk identity
- **WHEN** legacy or graph-only evidence has no chunk ID
- **THEN** the workspace SHALL render the citation without a malformed chunk link

### Requirement: Diagnostics are available without dominating results
The system SHALL keep planning, sufficiency, follow-up, retriever attempts, fusion, graph expansion, parent context, reranking, selection, source-metadata warnings, answer diagnostics, and raw JSON in collapsed diagnostic sections with concise warning summaries.

#### Scenario: Diagnostics contain warnings or fallback
- **WHEN** pipeline diagnostics report failures, fallback, missing source metadata, or partial branches
- **THEN** the primary result SHALL show a concise warning summary
- **AND** full typed details SHALL remain available on expansion

#### Scenario: Operator opens raw JSON
- **WHEN** the raw diagnostic section is expanded
- **THEN** the complete result envelope SHALL be shown as bounded formatted JSON

### Requirement: Result failures do not erase run context
The system SHALL retain the focused run, draft question, history, and available lifecycle metadata when result fetching fails, expires, is pre-result, or returns malformed/unsupported data.

#### Scenario: Result route returns pre-result conflict
- **WHEN** result fetching returns HTTP `409`
- **THEN** the workspace SHALL return to lifecycle/polling context without clearing the run

#### Scenario: Result route returns not found
- **WHEN** result fetching returns ownership-safe or retention `404`
- **THEN** the workspace SHALL show expired/not-owned result feedback while preserving history and draft

#### Scenario: One branch failed
- **WHEN** a partial result records branch failures
- **THEN** usable result content SHALL remain visible alongside limitations and diagnostics
