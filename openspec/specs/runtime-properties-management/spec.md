## Purpose

This specification defines the required behavior for runtime properties management in the GraphRAG admin UI.

## Requirements

### Requirement: Runtime properties catalog is displayed from backend settings
The system SHALL display backend runtime application settings from `/api/v1/runtime-settings` on the Settings/Properties page.

#### Scenario: User opens runtime properties
- **WHEN** a user opens the Settings/Properties page
- **THEN** the system SHALL request the runtime settings list
- **AND** the system SHALL render each setting key, label or description when present, category, current value, default value, source, value type, update mode, live-apply state, sensitivity, and constraints when provided

#### Scenario: Runtime settings request fails
- **WHEN** the runtime settings list request fails
- **THEN** the system SHALL render visible error feedback in the Settings/Properties page context
- **AND** the system SHALL keep frontend proxy/runtime information available when possible

### Requirement: Runtime properties can be filtered and inspected
The system SHALL provide controls that let users find settings by category, update mode, and text search without losing setting metadata.

#### Scenario: User filters runtime properties
- **WHEN** a user applies category, update-mode, or text filtering
- **THEN** the system SHALL show only matching settings
- **AND** the system SHALL preserve visible metadata needed to determine whether each setting is editable

#### Scenario: User inspects structured values
- **WHEN** a setting value, default value, or constraints object is structured data
- **THEN** the system SHALL render it as readable JSON or structured output instead of `[object Object]`

### Requirement: Mutable live runtime properties can be updated
The system SHALL allow users to update only backend-reported mutable live settings and SHALL submit updates as `{ value }` to `/api/v1/runtime-settings/{key}`.

#### Scenario: User updates a live setting
- **WHEN** a user edits a setting whose backend metadata indicates it is mutable and live-applied
- **THEN** the system SHALL send the new value to the runtime settings update endpoint
- **AND** the system SHALL refresh or replace the visible setting with the backend response
- **AND** the system SHALL show pending and success or failure feedback in the row or page context

#### Scenario: Backend rejects an update
- **WHEN** the backend rejects a runtime setting update because of validation, allowlist, or update-mode rules
- **THEN** the system SHALL render the normalized API error near the attempted edit
- **AND** the system SHALL keep the last known backend value visible

### Requirement: Runtime overrides can be cleared when allowed
The system SHALL allow users to clear a persisted runtime override only when the backend reports the setting as mutable through the runtime settings API.

#### Scenario: User clears an override
- **WHEN** a user clears an allowed runtime setting override
- **THEN** the system SHALL call `DELETE /api/v1/runtime-settings/{key}`
- **AND** the system SHALL update the visible setting to the backend response showing the default-backed current value

#### Scenario: Clear is not allowed
- **WHEN** a setting is read-only, restart-required, profile-managed, or sensitive read-only
- **THEN** the system SHALL NOT offer an enabled clear action for that setting
- **AND** the system SHALL display the backend-provided reason or update mode explaining why it cannot be cleared

### Requirement: Sensitive runtime properties are never exposed as secrets
The system SHALL treat sensitive runtime settings as read-only masked/configured status and SHALL NOT render raw secret values or editable secret controls for runtime settings.

#### Scenario: Sensitive setting is listed
- **WHEN** a runtime setting is marked sensitive
- **THEN** the system SHALL display only the backend-provided masked/configured representation
- **AND** the system SHALL NOT provide a value editor for that runtime setting

### Requirement: Relevant runtime properties are surfaced in workflow context
The system SHALL show read-only summaries of runtime settings that affect schema generation, document processing, query safety, and hybrid search on the corresponding workflow pages.

#### Scenario: User opens an affected workflow page
- **WHEN** a user opens Schemas, Documents, or Queries
- **THEN** the system SHALL display available active runtime setting context relevant to that page
- **AND** the system SHALL provide a clear path back to Settings/Properties for edits
