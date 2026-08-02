## REMOVED Requirements

### Requirement: Users can run hybrid search
**Reason**: The backend deleted the one-shot Hybrid Search endpoint and replaced it with readiness-aware durable Advanced Search runs.

**Migration**: Use the `/advanced-search` workspace to submit, monitor, cancel, revisit, and inspect cited search runs.

### Requirement: Hybrid search results show evidence and graph context
**Reason**: The legacy generic hit/graph response is replaced by typed version-one Advanced Search answers, claims, evidence, contexts, graph facts, and diagnostics.

**Migration**: Use cited result presentation in `/advanced-search` and direct citation links to the Chunking explorer.

### Requirement: Hybrid search failures are visible to users
**Reason**: Hybrid Search requests are no longer supported; Advanced Search has readiness, queue, lifecycle, cancellation, and result-specific failure handling.

**Migration**: Handle search errors in the Advanced Search workspace while preserving Ask and Cypher workflows.

## ADDED Requirements

### Requirement: Queries retains only supported workflows
The system SHALL keep Ask, Generate Cypher, Validate Cypher, and Execute Cypher on the Queries page unchanged and SHALL remove Hybrid Search from tabs, status summaries, pending aggregation, copy, and tests.

#### Scenario: Open Queries after Advanced Search replacement
- **WHEN** a user opens the Queries page
- **THEN** exactly the four supported workflows SHALL remain available
- **AND** no Hybrid Search tab or status summary SHALL render

#### Scenario: Use supported query workflows
- **WHEN** a user asks, generates, validates, or executes Cypher
- **THEN** existing request, draft, error, and result behavior SHALL remain unchanged
