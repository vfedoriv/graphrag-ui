## MODIFIED Requirements

### Requirement: Terminal result rendering is version-safe
The system SHALL fetch advanced-search results automatically only for `COMPLETED` or `PARTIAL` runs and SHALL render semantic content only after both envelope and nested payload versions are supported and the version-one structure is valid, including valid nullable fields defined by the backend contract.

#### Scenario: Completed run has valid version-one result
- **WHEN** both payload versions equal 1, required structures are valid, and diagnostic attempts may contain `subqueryId: null` for aggregate retriever branches
- **THEN** the workspace SHALL render the typed result
- **AND** SHALL preserve the null identifier in typed diagnostics without treating the result as malformed

#### Scenario: Partial run has valid version-one result
- **WHEN** a `PARTIAL` run returns a valid version-one result
- **THEN** the workspace SHALL render available answer/evidence content
- **AND** SHALL identify the run as partial and expose branch limitations/failures

#### Scenario: Payload version is unsupported
- **WHEN** either payload version is not 1 or versions disagree
- **THEN** the workspace SHALL show an explicit unsupported-result state
- **AND** SHALL retain the raw diagnostic JSON in a collapsed section

#### Scenario: Supported payload is malformed
- **WHEN** versions equal 1 but required answer, collection, reference, or non-null diagnostic structures are malformed
- **THEN** the workspace SHALL show a malformed-result state describing the validation failure
- **AND** SHALL not attempt best-effort semantic coercion
