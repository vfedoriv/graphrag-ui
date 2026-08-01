## MODIFIED Requirements

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
