## ADDED Requirements

### Requirement: Query parameter JSON must be valid before endpoint submission
The system SHALL prevent validate and execute query submissions when the query parameter JSON draft is invalid, instead of silently replacing invalid parameters with an empty object.

#### Scenario: Validate with invalid parameters JSON
- **WHEN** a user attempts to validate a Cypher query while the parameters JSON field contains invalid JSON
- **THEN** the system SHALL block the validation request and render the parameter format error

#### Scenario: Execute with invalid parameters JSON
- **WHEN** a user attempts to execute a Cypher query while the parameters JSON field contains invalid JSON
- **THEN** the system SHALL block the execution request and render the parameter format error

### Requirement: Query authoring draft state remains user-editable
The system SHALL keep prompt, Cypher, and parameter JSON values as client-owned drafts while using mutation hooks for backend generate, validate, execute, and ask request state.

#### Scenario: Generated query seeds editable draft
- **WHEN** query generation succeeds
- **THEN** the system SHALL populate editable Cypher and parameter draft fields from the response while allowing the user to modify them before validation or execution
