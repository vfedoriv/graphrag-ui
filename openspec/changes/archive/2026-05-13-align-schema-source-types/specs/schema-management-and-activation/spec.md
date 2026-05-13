## ADDED Requirements

### Requirement: Schema source types match backend contract
The system SHALL expose and process only backend-supported schema source types: `PREDEFINED` and `GENERATED`.

#### Scenario: Source type options exclude unsupported values
- **WHEN** a user views schema source type fields, filters, or labels in schema workflows
- **THEN** the system SHALL present only `PREDEFINED` and `GENERATED` and SHALL NOT expose `USER_DEFINED`

#### Scenario: Schema payloads use supported source types only
- **WHEN** the frontend submits schema-related requests that include source type
- **THEN** the system SHALL send only `PREDEFINED` or `GENERATED` values

#### Scenario: Unsupported source type from API is visibly handled
- **WHEN** the backend response contains a source type outside `PREDEFINED` and `GENERATED`
- **THEN** the system SHALL show a visible unsupported-source-type fallback state without remapping it to a supported value
