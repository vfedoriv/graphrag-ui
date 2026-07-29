## MODIFIED Requirements

### Requirement: AI profiles can be listed and inspected
The system SHALL display AI profiles from `/api/v1/ai-profiles` on the dedicated AI Providers page and SHALL NOT display the AI profiles management section on Settings/Properties.

#### Scenario: User opens AI profiles section
- **WHEN** a user opens the AI Providers page
- **THEN** the system SHALL request the profile list
- **AND** the system SHALL render profile id, name, base URL, chat model, embedding model, embedding dimensions, timeout, retry count, default status, revision, API key configured state, API key mask when provided, and timestamps when available

#### Scenario: AI profile request fails
- **WHEN** the AI profile list request fails
- **THEN** the system SHALL render visible error feedback in the AI Providers page context

#### Scenario: User opens Settings/Properties
- **WHEN** a user opens the Settings/Properties page
- **THEN** the system SHALL NOT render the AI profiles management section

### Requirement: Profile-managed runtime settings direct users to AI profiles
The system SHALL explain profile-managed runtime settings by linking them to AI profile management on the AI Providers page instead of offering runtime setting editors.

#### Scenario: User views profile-managed setting
- **WHEN** a runtime setting has profile-managed update semantics
- **THEN** the system SHALL show that provider behavior is changed through AI profiles
- **AND** the system SHALL provide a path to the AI profiles section on AI Providers
