## ADDED Requirements

### Requirement: Shared plan resources support multiple reprocessing reasons
The system SHALL represent schema-activation and chunk-strategy-migration plans through shared typed resources while preserving reason-specific creation and filtering behavior.

#### Scenario: Schema draft loads its history
- **WHEN** schema-publication workflow requests reprocessing history
- **THEN** it SHALL continue filtering by owned draft ID and SHALL retain schema-specific activation semantics

#### Scenario: Chunking loads migration history
- **WHEN** Chunking requests reprocessing history
- **THEN** it SHALL filter by `reason=CHUNK_STRATEGY_MIGRATION` and SHALL not require a draft ID

### Requirement: Shared plan presentation exposes generalized target metadata
The system SHALL make plan reason, selection, expected chunker revision, target currency, retryability, retry lineage, and generalized statuses available to reason-specific workflow presentations.

#### Scenario: Present schema activation plan
- **WHEN** a plan reason is `SCHEMA_ACTIVATION`
- **THEN** the schema-draft workflow SHALL retain its published-draft/schema context and progress behavior

#### Scenario: Present chunk migration plan
- **WHEN** a plan reason is `CHUNK_STRATEGY_MIGRATION`
- **THEN** the Chunking workflow SHALL show selection and expected chunker revision in addition to shared progress and lineage

#### Scenario: Present target-changed item
- **WHEN** a shared plan item is `BLOCKED_TARGET_CHANGED`
- **THEN** the consuming workflow SHALL receive that distinct status and SHALL not collapse it into generic `BLOCKED` or `FAILED`
