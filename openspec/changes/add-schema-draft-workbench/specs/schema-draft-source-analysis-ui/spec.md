## ADDED Requirements

### Requirement: Draft sources preserve their distinct ownership semantics
The system SHALL let users add existing knowledge-base documents, pasted text, and draft-owned files as distinct draft source types and SHALL show only backend-returned metadata after submission.

#### Scenario: Add existing documents
- **WHEN** a user selects one or more documents owned by the current knowledge base
- **THEN** the system SHALL add each document source using the latest draft revision from the preceding successful request
- **AND** SHALL report per-document success or failure

#### Scenario: Add pasted text
- **WHEN** a user supplies a source name and non-empty pasted text
- **THEN** the system SHALL create a `TEXT` source
- **AND** SHALL not represent it as a normal uploaded document

#### Scenario: Add a direct file
- **WHEN** a user selects a source file
- **THEN** the system SHALL upload it to the draft file-source endpoint with the current revision
- **AND** SHALL not add it to the knowledge base document list

### Requirement: Source lifecycle states drive available actions
The system SHALL display source type, status, revision, name or document context, fingerprint, size, analyzed state, and timestamps, and SHALL expose only lifecycle actions valid for the returned source state.

#### Scenario: Document source becomes stale or unavailable
- **WHEN** a document source is returned as `STALE` or `UNAVAILABLE`
- **THEN** the system SHALL show that the source no longer matches the analyzed snapshot
- **AND** SHALL offer refresh only when supported by the backend state

#### Scenario: Remove an analyzed source
- **WHEN** a user confirms removal of an analyzed active source
- **THEN** the system SHALL submit removal with the current revision
- **AND** SHALL render the logically retained source as inactive when returned by the refreshed list

#### Scenario: Restore an inactive source
- **WHEN** a source is restorable and the user invokes Restore
- **THEN** the system SHALL submit the current revision and refresh source and draft state after success

### Requirement: Revision-bearing source mutations are serialized
The system SHALL prevent concurrent source mutations from reusing the same draft revision and SHALL adopt authoritative draft state between requests.

#### Scenario: Add several selected document sources
- **WHEN** a user submits multiple document selections
- **THEN** the system SHALL execute source additions sequentially
- **AND** SHALL not issue all additions concurrently with one revision value

#### Scenario: A source addition fails midway
- **WHEN** some prior additions succeeded and a later addition fails
- **THEN** the system SHALL retain successful source rows
- **AND** SHALL keep unresolved selections available for explicit retry

### Requirement: Analysis is a durable polled workflow
The system SHALL start analysis with the current draft revision, poll the authoritative run resource while it is active, display aggregate progress and nested paged `sourceOutcomes`, and stop polling at a terminal state.

#### Scenario: Start analysis
- **WHEN** an open draft has analyzable active sources and the user starts analysis
- **THEN** the system SHALL send the current draft revision
- **AND** SHALL poll the returned run location while status is `RUNNING`

#### Scenario: Analysis completes
- **WHEN** a run becomes `COMPLETED`
- **THEN** the system SHALL stop polling and refresh draft detail, candidates, conflicts, projection, and diff

#### Scenario: Analysis partially completes
- **WHEN** a run becomes `PARTIAL`
- **THEN** the system SHALL show succeeded and failed source counts and each source outcome from the nested `page`, `size`, `totalElements`, and `content` envelope
- **AND** SHALL keep any returned aggregate available for review

#### Scenario: Analysis fails
- **WHEN** a run becomes `FAILED`
- **THEN** the system SHALL show its privacy-safe failure category and retryability without inventing model or source content

### Requirement: Analysis progress survives navigation and reload
The system SHALL restore current analysis progress from the draft's workflow reference, expose paged recent run history, and never depend on route-local mutation state or a browser-retained run identifier for correctness.

#### Scenario: Return while analysis is running
- **WHEN** the page remounts while a draft analysis is active
- **THEN** the system SHALL follow `currentAnalysis.statusLocation` and resume polling it

#### Scenario: Inspect analysis history
- **WHEN** the user opens analysis history
- **THEN** the system SHALL load the paged analysis-run list ordered by backend history semantics
- **AND** SHALL show each run's currentness, retryability, retry lineage, aggregate, counts, timestamps, and status location

#### Scenario: Latest run is not current
- **WHEN** source membership, guidance, or draft state makes a historical run stale
- **THEN** the system SHALL keep the run inspectable
- **AND** SHALL not treat recency alone as proof that its result is current

### Requirement: Retry preserves backend reuse semantics
The system SHALL allow retry only for a terminal retryable run and SHALL bind retry to the latest reviewed draft revision.

#### Scenario: Retry partial analysis
- **WHEN** a partial run is retryable and the user requests retry
- **THEN** the system SHALL call the run retry endpoint with the current revision
- **AND** SHALL present reused successful source outcomes separately from newly executed outcomes
