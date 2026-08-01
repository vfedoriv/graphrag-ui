## ADDED Requirements

### Requirement: Chunking workspace exposes global strategy state
The system SHALL provide a lazy `/chunking` workspace whose Strategy view clearly identifies chunk configuration as global and uses `GET /api/v1/chunking-state` as the authoritative effective read model.

#### Scenario: Open Chunking without a selected knowledge base
- **WHEN** a user opens `/chunking` with no knowledge base selected
- **THEN** the Strategy view SHALL remain available because chunking configuration is global
- **AND** knowledge-base-scoped views SHALL explain that they require a selection

#### Scenario: Open the default Chunking URL
- **WHEN** `/chunking` has no `view` parameter
- **THEN** the workspace SHALL display Strategy and normalize its URL-addressable view state

#### Scenario: Load aggregate state
- **WHEN** chunking state loads successfully
- **THEN** the Strategy view SHALL show canonical effective values, value sources, settings hash, component revisions, tokenizer identity/revision/count mode, parser policy revision, representation revision, effective chunker revision, and migration lifecycle

#### Scenario: Chunking state fails independently
- **WHEN** aggregate state fails but runtime settings remain available
- **THEN** the workspace SHALL show source-specific failure feedback
- **AND** SHALL NOT claim that runtime-setting values are the authoritative combined state

### Requirement: Strategy controls are curated and canonical
The system SHALL render editable canonical chunk controls in this fixed order: strategy, target tokens, overlap tokens, hard character limit, parent target tokens, parent hard character limit, parent maximum pages, contextual-header maximum tokens, and contextual-header maximum characters.

#### Scenario: Build a canonical control
- **WHEN** a corresponding runtime-setting definition is available
- **THEN** the control SHALL use its mutability, value type, enum choices, numeric constraints, label/description, and update rules
- **AND** SHALL display the aggregate effective value and source separately from any staged draft

#### Scenario: Runtime setting is unavailable or immutable
- **WHEN** a curated canonical key is missing or reported non-mutable
- **THEN** the workspace SHALL render its effective aggregate value read-only with an explanation
- **AND** SHALL NOT construct a mutation for that key

#### Scenario: Unknown chunk setting exists
- **WHEN** runtime settings includes a chunk-related key outside the curated list
- **THEN** the key SHALL remain manageable through generic Settings
- **AND** SHALL NOT be inserted automatically into the curated order

### Requirement: Compatibility aliases are explanatory only
The system SHALL hide compatibility aliases from editable controls and SHALL display reported alias precedence in a collapsed read-only explanation when aliases are present.

#### Scenario: Backend reports compatibility aliases
- **WHEN** aggregate state contains one or more aliases
- **THEN** the compatibility section SHALL expose alias key, canonical key, configured value, effective value, authority, and precedence

#### Scenario: No aliases are relevant
- **WHEN** aggregate state contains no compatibility aliases
- **THEN** the workspace SHALL not display an empty compatibility explanation

### Requirement: Strategy changes apply atomically
The system SHALL stage valid changed canonical values locally and submit only changed settings in one bulk runtime-settings request after explicit user action.

#### Scenario: Edit multiple strategy controls
- **WHEN** a user changes multiple editable controls
- **THEN** no request SHALL be sent until Apply is activated
- **AND** the page SHALL mark each changed draft while preserving the last effective value

#### Scenario: Apply succeeds
- **WHEN** the bulk update succeeds
- **THEN** the system SHALL invalidate and refetch both runtime settings and chunking state
- **AND** SHALL clear accepted drafts only after the accepted settings are reflected

#### Scenario: Apply fails
- **WHEN** the backend rejects the bulk update
- **THEN** the system SHALL retain every staged draft and display normalized validation/admission feedback
- **AND** SHALL keep last-known effective state visible

### Requirement: Saving strategy never implies migration
The system SHALL explain that a successful strategy update does not change existing document chunks and SHALL offer an explicit navigation action to migration preview without starting preview or reprocessing automatically.

#### Scenario: Strategy update completes
- **WHEN** the refreshed effective chunker revision differs after Apply
- **THEN** the workspace SHALL state that existing documents were not changed
- **AND** SHALL offer a user-initiated action to the Reprocessing view

#### Scenario: User does not choose migration
- **WHEN** a strategy update succeeds and the user takes no migration action
- **THEN** the frontend SHALL NOT call migration preview or plan-creation endpoints
