## Purpose

This specification defines the required behavior for runtime properties management in the GraphRAG admin UI.

## Requirements

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

### Requirement: Mutable runtime properties can be staged and applied
The system SHALL allow users to edit backend-reported mutable runtime settings that are not sensitive or profile-managed, including settings whose new value requires a backend restart before it becomes active. The system SHALL stage edited values locally and SHALL submit modified settings through the backend bulk update endpoint only when the user explicitly applies the changes.

#### Scenario: User edits a live setting draft
- **WHEN** a user changes an editable setting whose backend metadata indicates it is live-applied
- **THEN** the system SHALL update the local draft value without immediately sending an update request
- **AND** the system SHALL mark the setting as modified
- **AND** the system SHALL keep the last known backend value visible until changes are applied

#### Scenario: User edits a restart-required setting draft
- **WHEN** a user changes an editable setting whose backend metadata indicates restart is required
- **THEN** the system SHALL update the local draft value without immediately sending an update request
- **AND** the system SHALL mark the setting as modified
- **AND** the system SHALL display the active current value separately from the drafted value
- **AND** the system SHALL identify that the drafted value will require backend restart after it is accepted

#### Scenario: User applies staged runtime setting changes
- **WHEN** a user applies staged runtime property changes
- **THEN** the system SHALL submit only modified editable settings to `PUT /api/v1/runtime-settings` as `{ updates: [{ key, value }] }`
- **AND** each submitted setting value SHALL be parsed according to its backend-reported value type
- **AND** the system SHALL show pending feedback for the apply operation
- **AND** the system SHALL refresh or replace visible settings with accepted backend responses

#### Scenario: Bulk apply succeeds
- **WHEN** the backend accepts a staged runtime settings bulk update
- **THEN** the system SHALL replace the corresponding visible settings with the returned setting representations
- **AND** the system SHALL clear the drafts and modified markers for accepted settings
- **AND** the system SHALL show success feedback for the apply operation

#### Scenario: Restart-required setting update is accepted
- **WHEN** the backend accepts an update for a restart-required setting
- **THEN** the system SHALL continue to show the last known active current value when it remains active until restart
- **AND** the system SHALL show the accepted pending value or submitted accepted value separately
- **AND** the system SHALL display restart-required status explaining that backend restart is needed before the accepted value becomes active

#### Scenario: Backend rejects a staged bulk update
- **WHEN** the backend rejects a staged runtime settings bulk update because of validation, duplicate keys, allowlist, or update-mode rules
- **THEN** the system SHALL render the normalized API error in the runtime properties apply context
- **AND** the system SHALL keep the last known backend value visible
- **AND** the system SHALL keep all submitted drafts available for correction
- **AND** the system SHALL NOT clear modified markers for the rejected bulk request

### Requirement: Runtime overrides can be cleared when allowed
The system SHALL allow users to clear a persisted runtime override only when the backend reports the setting as mutable through the runtime settings API and the setting is not sensitive or profile-managed.

#### Scenario: User clears a live override
- **WHEN** a user clears an allowed live-applied runtime setting override
- **THEN** the system SHALL call `DELETE /api/v1/runtime-settings/{key}`
- **AND** the system SHALL update the visible setting to the backend response showing the default-backed current value

#### Scenario: User clears a restart-required override
- **WHEN** a user clears an allowed restart-required runtime setting override
- **THEN** the system SHALL call `DELETE /api/v1/runtime-settings/{key}`
- **AND** the system SHALL show the active current value separately from the cleared pending or accepted default-backed value when restart is required before activation
- **AND** the system SHALL display restart-required status explaining that backend restart is needed before the cleared value becomes active

#### Scenario: Clear is not allowed
- **WHEN** a setting is read-only, profile-managed, or sensitive read-only
- **THEN** the system SHALL NOT offer an enabled clear action for that setting
- **AND** the system SHALL display the backend-provided reason or update mode explaining why it cannot be cleared

### Requirement: Sensitive runtime properties are never exposed as secrets
The system SHALL treat sensitive runtime settings as read-only masked/configured status and SHALL NOT render raw secret values or editable secret controls for runtime settings.

#### Scenario: Sensitive setting is listed
- **WHEN** a runtime setting is marked sensitive
- **THEN** the system SHALL display only the backend-provided masked/configured representation
- **AND** the system SHALL NOT provide a value editor for that runtime setting

### Requirement: Relevant runtime properties are surfaced in workflow context
The system SHALL show read-only summaries of runtime settings that affect schema generation, document processing, query safety, chunking, and advanced search on the corresponding workflow pages, while all advanced-search runtime tuning remains editable only through generic Settings.

#### Scenario: User opens an affected workflow page
- **WHEN** a user opens Schemas, Documents, Queries, Chunking, or Advanced Search
- **THEN** the system SHALL display available active runtime-setting context relevant to that page
- **AND** SHALL provide a clear path to AI Providers for provider-related edits
- **AND** SHALL provide a clear path to Settings/Properties for other runtime-property edits

#### Scenario: User opens Advanced Search
- **WHEN** runtime settings provide advanced-search default or bound hints
- **THEN** the workspace SHALL expose those values read-only for per-run evidence guidance
- **AND** SHALL not expose global tuning mutations outside Settings

#### Scenario: Hybrid Search tuning hints exist in old frontend copy
- **WHEN** the deleted Hybrid Search workflow is removed
- **THEN** its workflow-specific runtime-setting hints and copy SHALL also be removed

### Requirement: Chunking workspace combines mutation definitions with authoritative aggregate state
The system SHALL keep generic runtime Settings capable of editing chunking keys while the Chunking Strategy view uses runtime-setting definitions for mutation semantics and `GET /api/v1/chunking-state` for effective combined values and revisions.

#### Scenario: Inspect a chunking setting in generic Settings
- **WHEN** a chunking setting belongs to the non-provider runtime catalog
- **THEN** generic Settings SHALL continue to display and edit it under existing runtime-property rules

#### Scenario: Inspect the same setting in Chunking
- **WHEN** the key is part of the curated Strategy view
- **THEN** Chunking SHALL use runtime-setting metadata for editability and constraints
- **AND** SHALL use aggregate chunking state for its effective value, source, component revisions, settings hash, effective revision, and migration lifecycle

#### Scenario: Apply chunking changes
- **WHEN** Chunking submits a bulk runtime-settings update
- **THEN** the frontend SHALL refetch both runtime settings and aggregate chunking state
- **AND** SHALL NOT create a migration plan automatically
