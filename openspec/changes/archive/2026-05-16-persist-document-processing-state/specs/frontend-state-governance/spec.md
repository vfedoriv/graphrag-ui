## ADDED Requirements

### Requirement: Long-running workflow indicators use durable server state when available
The system SHALL derive user-visible indicators for long-running backend workflows from server state when backend data contains an authoritative in-progress signal.

#### Scenario: Route-local state is lost during navigation
- **WHEN** a controller page is unmounted and later remounted while a backend workflow is still active
- **THEN** the remounted page SHALL restore workflow feedback from query data rather than depending only on the previous component instance's local state

#### Scenario: Local action starts before server state updates
- **WHEN** a user starts a backend workflow and the server list has not yet reflected the in-progress status
- **THEN** the page MAY use local mutation state for immediate feedback until query data is updated
