## ADDED Requirements

### Requirement: File selection button behavior is regression tested
The system SHALL include automated tests that verify button-triggered file selection interactions, including browser input reset behavior and async callback sequencing.

#### Scenario: Select same file twice
- **WHEN** a user selects a file and then selects the same file again
- **THEN** the input reset behavior SHALL allow the second selection callback to execute

#### Scenario: Async file callback execution
- **WHEN** `onFileSelected` performs asynchronous work
- **THEN** tests SHALL verify the callback receives the selected file and completes without swallowing errors
