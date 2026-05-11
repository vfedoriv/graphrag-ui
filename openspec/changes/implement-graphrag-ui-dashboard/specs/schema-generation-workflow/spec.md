## ADDED Requirements

### Requirement: Schema generation follows staged workflow
The system SHALL implement a staged workflow that generates example content first, then generates YAML, then validates/edits YAML, and finally creates a schema.

#### Scenario: Prevent schema generation without example stage
- **WHEN** a user attempts YAML schema generation before example generation has completed
- **THEN** the system SHALL block progression and indicate the missing prerequisite stage

### Requirement: Generated artifacts remain editable before final creation
The system SHALL allow users to edit generated example text and generated YAML before validation and creation.

#### Scenario: Edit generated YAML before submit
- **WHEN** a user modifies generated YAML and requests validation
- **THEN** the system SHALL validate the edited YAML and use that edited content for subsequent create action
