# frontend-performance-governance Specification

## Purpose
Define frontend bundle-size and route-loading expectations for preserving responsive initial app load as controller pages grow.

## Requirements
### Requirement: Initial route bundle excludes non-active page modules
The system SHALL load major controller and Schema Builder page modules on demand instead of importing all route page modules into the initial application bundle.

#### Scenario: Build production assets
- **WHEN** a developer runs the production build command
- **THEN** route page code SHALL be split into loadable chunks
- **AND** the initial application chunk SHALL not include all controller and Schema Builder page modules eagerly

#### Scenario: Open dashboard first
- **WHEN** a user first opens the dashboard route
- **THEN** the app shell and dashboard SHALL render without requiring Schema Builder route code to be loaded first

### Requirement: Route code splitting preserves navigation behavior
The system SHALL preserve existing app-shell navigation, route paths, and global knowledge-base selection while route components load lazily.

#### Scenario: Navigate to lazy route
- **WHEN** a user selects a controller page or Schema Builder from primary navigation
- **THEN** the system SHALL route to the same URL path as before
- **AND** the selected page SHALL render after its route module loads

#### Scenario: Route module is loading
- **WHEN** a lazy route module has not finished loading
- **THEN** the system SHALL show a lightweight loading state within the existing workspace shell
