## MODIFIED Requirements

### Requirement: Runtime properties catalog is displayed from backend settings
The system SHALL display backend runtime application settings from `/api/v1/runtime-settings` across Settings/Properties and AI Providers according to provider ownership, while the Settings/Properties page SHALL display only settings that are neither in the `provider` category nor `PROFILE_MANAGED`.

#### Scenario: User opens runtime properties
- **WHEN** a user opens the Settings/Properties page
- **THEN** the system SHALL request the runtime settings list
- **AND** the system SHALL render each non-provider setting key, label or description when present, category, current value, default value, source, value type, update mode, live-apply state, sensitivity, and constraints when provided
- **AND** the system SHALL NOT render AI provider-related settings in the Settings/Properties catalog

#### Scenario: Runtime settings request fails
- **WHEN** the runtime settings list request fails
- **THEN** the system SHALL render visible error feedback in the Settings/Properties page context
- **AND** the system SHALL keep frontend proxy/runtime information available when possible

### Requirement: Runtime properties can be filtered and inspected
The system SHALL provide controls that let users find settings owned by the current page by category, update mode, and text search without losing setting metadata.

#### Scenario: User filters runtime properties
- **WHEN** a user applies category, update-mode, or text filtering
- **THEN** the system SHALL show only matching settings from the current page's provider or non-provider subset
- **AND** the system SHALL preserve visible metadata needed to determine whether each setting is editable

#### Scenario: User inspects structured values
- **WHEN** a setting value, default value, or constraints object is structured data
- **THEN** the system SHALL render it as readable JSON or structured output instead of `[object Object]`

### Requirement: Relevant runtime properties are surfaced in workflow context
The system SHALL show read-only summaries of runtime settings that affect schema generation, document processing, query safety, and hybrid search on the corresponding workflow pages.

#### Scenario: User opens an affected workflow page
- **WHEN** a user opens Schemas, Documents, or Queries
- **THEN** the system SHALL display available active runtime setting context relevant to that page
- **AND** the system SHALL provide a clear path to AI Providers for provider-related edits
- **AND** the system SHALL provide a clear path to Settings/Properties for other runtime property edits
