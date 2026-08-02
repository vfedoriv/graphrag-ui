## ADDED Requirements

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
