## Purpose

This specification defines the dedicated AI Providers workspace for provider-owned runtime properties and AI profile management.

## Requirements

### Requirement: AI Providers is a dedicated navigation destination
The system SHALL provide a primary-navigation destination named **AI Providers** with a dedicated route separate from Settings/Properties.

#### Scenario: User opens AI Providers from primary navigation
- **WHEN** a user selects AI Providers from primary navigation
- **THEN** the system SHALL navigate to the dedicated AI Providers page
- **AND** the system SHALL identify AI Providers as the active navigation destination

#### Scenario: User opens AI Providers by URL
- **WHEN** a user opens the AI Providers route directly
- **THEN** the system SHALL render the AI Providers page through the application shell

### Requirement: AI Providers colocates provider properties and profiles
The system SHALL display AI provider-related runtime properties and AI profile management together on the AI Providers page.

#### Scenario: AI Providers data loads successfully
- **WHEN** the AI Providers page receives runtime settings and AI profiles
- **THEN** the system SHALL render AI provider-related runtime properties
- **AND** the system SHALL render the AI profiles management section on the same page

#### Scenario: One AI Providers data source fails
- **WHEN** either runtime settings or AI profiles cannot be loaded
- **THEN** the system SHALL show error feedback in the affected section
- **AND** the system SHALL keep the independently available section usable

### Requirement: Runtime settings are partitioned by provider ownership
The system SHALL classify a runtime setting as AI-provider-related when its category is `provider` or its update mode is `PROFILE_MANAGED`, using case-insensitive metadata comparison, and SHALL place every returned setting on exactly one of AI Providers or Settings/Properties.

#### Scenario: Provider-category setting is returned
- **WHEN** the runtime settings catalog contains a setting whose category is `provider`
- **THEN** the system SHALL display that setting on AI Providers
- **AND** the system SHALL NOT display that setting on Settings/Properties

#### Scenario: Profile-managed setting is returned
- **WHEN** the runtime settings catalog contains a setting whose update mode is `PROFILE_MANAGED`
- **THEN** the system SHALL display that setting on AI Providers even when its category is not `provider`
- **AND** the system SHALL NOT display that setting on Settings/Properties

#### Scenario: Non-provider setting is returned
- **WHEN** a runtime setting is neither in the `provider` category nor profile-managed
- **THEN** the system SHALL display that setting on Settings/Properties
- **AND** the system SHALL NOT display that setting on AI Providers

### Requirement: Provider properties preserve backend-owned controls
The system SHALL preserve the runtime catalog's existing metadata, editing, restart, sensitivity, filtering, and error behavior when provider-related settings are rendered on AI Providers.

#### Scenario: Provider property is not editable
- **WHEN** a provider-related runtime setting is sensitive, profile-managed, read-only, or otherwise backend-reported as non-editable
- **THEN** the system SHALL NOT offer an enabled update or clear control for that setting
- **AND** the system SHALL display its backend-provided reason or update mode

#### Scenario: User filters provider properties
- **WHEN** a user applies category, update-mode, or text filtering on AI Providers
- **THEN** the system SHALL filter only the provider-related property subset
- **AND** the system SHALL preserve visible metadata needed to inspect each matching setting
