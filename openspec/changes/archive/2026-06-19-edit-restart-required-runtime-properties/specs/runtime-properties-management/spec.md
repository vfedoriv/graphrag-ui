## MODIFIED Requirements

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
