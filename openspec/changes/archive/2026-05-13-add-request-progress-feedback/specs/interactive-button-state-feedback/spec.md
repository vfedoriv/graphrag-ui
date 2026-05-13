## ADDED Requirements

### Requirement: Async action buttons MUST expose pending state
The system SHALL present a visible pending/loading state for buttons that trigger backend endpoint requests, and SHALL prevent duplicate activation while the request is in progress.

#### Scenario: Trigger async endpoint action
- **WHEN** a user clicks an action button that starts an async backend request
- **THEN** the button SHALL show pending feedback and SHALL be non-interactive until the request settles
