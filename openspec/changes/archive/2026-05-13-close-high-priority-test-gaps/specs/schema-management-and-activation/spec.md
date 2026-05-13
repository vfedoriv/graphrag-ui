## ADDED Requirements

### Requirement: Schema activation table action is workflow tested
The system SHALL include workflow tests verifying schema activation can be triggered from the schemas table row action and calls the expected endpoint.

#### Scenario: Activate schema from list row
- **WHEN** a user clicks Activate for a schema row with a selected knowledge base
- **THEN** tests SHALL verify the activation endpoint call and related query invalidation effects
