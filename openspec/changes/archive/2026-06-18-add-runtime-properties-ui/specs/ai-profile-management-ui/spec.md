## ADDED Requirements

### Requirement: AI profiles can be listed and inspected
The system SHALL display AI profiles from `/api/v1/ai-profiles` on the Settings/Properties page.

#### Scenario: User opens AI profiles section
- **WHEN** a user opens the AI profiles section
- **THEN** the system SHALL request the profile list
- **AND** the system SHALL render profile id, name, base URL, chat model, embedding model, embedding dimensions, timeout, retry count, default status, revision, API key configured state, API key mask when provided, and timestamps when available

#### Scenario: AI profile request fails
- **WHEN** the AI profile list request fails
- **THEN** the system SHALL render visible error feedback in the Settings/Properties page context

### Requirement: AI profiles can be created
The system SHALL allow users to create OpenAI-compatible AI profiles using the backend profile create endpoint.

#### Scenario: User creates an AI profile
- **WHEN** a user submits valid profile id, name, base URL, optional API key, chat model, embedding model, embedding dimensions, timeout, retry count, and default profile choice
- **THEN** the system SHALL send the profile to `/api/v1/ai-profiles`
- **AND** the system SHALL refresh the profile list after success
- **AND** the system SHALL display backend validation errors inline when creation fails

### Requirement: AI profiles can be updated without exposing API keys
The system SHALL allow users to update profile fields while keeping API keys write-only.

#### Scenario: User updates non-secret profile fields
- **WHEN** a user updates profile name, base URL, model, dimensions, timeout, retry, or default status without entering a new API key
- **THEN** the system SHALL submit the update without treating any displayed mask as a secret value
- **AND** the system SHALL preserve the backend-managed API key state

#### Scenario: User replaces or clears API key
- **WHEN** a user explicitly enters a replacement API key or chooses to clear an API key
- **THEN** the system SHALL submit the corresponding update payload
- **AND** the system SHALL show only configured/masked API key state after the request completes

### Requirement: AI profiles can be deleted with confirmation
The system SHALL allow users to delete AI profiles through a confirmed action and SHALL keep profile state consistent with backend responses.

#### Scenario: User confirms profile deletion
- **WHEN** a user chooses to delete an AI profile and confirms the action
- **THEN** the system SHALL send `DELETE /api/v1/ai-profiles/{profileId}`
- **AND** the system SHALL refresh profile and knowledge-base profile context after success

#### Scenario: User cancels profile deletion
- **WHEN** a user cancels profile deletion confirmation
- **THEN** the system SHALL NOT send a delete request

### Requirement: Profile-managed runtime settings direct users to AI profiles
The system SHALL explain profile-managed runtime settings by linking them to AI profile management instead of offering runtime setting editors.

#### Scenario: User views profile-managed setting
- **WHEN** a runtime setting has profile-managed update semantics
- **THEN** the system SHALL show that provider behavior is changed through AI profiles
- **AND** the system SHALL provide a path to the AI profiles section

