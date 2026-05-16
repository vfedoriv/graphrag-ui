# frontend-state-governance Specification

## Purpose
TBD - created by archiving change improve-state-management-practices. Update Purpose after archive.
## Requirements
### Requirement: Server state is owned by TanStack Query
The system SHALL use TanStack Query hooks as the owner for backend-fetched data, backend command execution state, request errors, cache updates, and invalidation in user-facing endpoint workflows.

#### Scenario: Endpoint workflow requests backend data
- **WHEN** a controller workflow fetches, creates, updates, deletes, validates, generates, processes, executes, or asks through the GraphRAG API
- **THEN** the workflow SHALL use a typed query or mutation hook from an API module rather than calling the API function directly from the component

#### Scenario: Backend mutation succeeds
- **WHEN** a mutation changes backend state that affects visible lists or context
- **THEN** the mutation SHALL invalidate or update the related TanStack Query cache entries

### Requirement: Client state remains minimal and locally owned
The system SHALL keep component state limited to client-owned drafts, selected UI ids, selected files, active tabs, confirmations, and editable generated content that users can modify before submitting another request.

#### Scenario: Value can be derived during render
- **WHEN** a value can be calculated from current props, query data, or existing local draft state
- **THEN** the system SHALL derive it during render instead of storing a synchronized copy in state

#### Scenario: Generated backend result becomes editable draft
- **WHEN** a backend generation response populates a user-editable field for a later workflow step
- **THEN** the field MAY store the generated value as local draft state after success

### Requirement: Nullable resource queries use explicit safe keys
The system SHALL define stable query-key factories for queries with nullable resource identifiers and SHALL prevent query functions from invoking backend calls with null identifiers.

#### Scenario: Resource id is not selected
- **WHEN** a query depends on a missing selected knowledge base, document, schema, or other resource id
- **THEN** the query SHALL remain disabled under an explicit nullable-safe query key and SHALL NOT call the backend with a coerced null value

### Requirement: State ownership behavior is regression tested
The system SHALL include automated tests for state ownership boundaries that are likely to regress user-visible behavior.

#### Scenario: Add or refactor async workflow state
- **WHEN** an async controller workflow is added or refactored
- **THEN** tests SHALL verify pending, success, error, and cache invalidation or result-draft behavior as applicable

### Requirement: Long-running workflow indicators use durable server state when available
The system SHALL derive user-visible indicators for long-running backend workflows from server state when backend data contains an authoritative in-progress signal.

#### Scenario: Route-local state is lost during navigation
- **WHEN** a controller page is unmounted and later remounted while a backend workflow is still active
- **THEN** the remounted page SHALL restore workflow feedback from query data rather than depending only on the previous component instance's local state

#### Scenario: Local action starts before server state updates
- **WHEN** a user starts a backend workflow and the server list has not yet reflected the in-progress status
- **THEN** the page MAY use local mutation state for immediate feedback until query data is updated

