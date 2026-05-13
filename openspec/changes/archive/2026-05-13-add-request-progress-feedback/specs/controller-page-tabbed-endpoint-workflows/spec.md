## ADDED Requirements

### Requirement: Controller workflows MUST show in-flight progress indicators
The system SHALL display a visible progress indicator in the workflow context while endpoint requests are in flight, so users can tell the app is waiting for backend response.

#### Scenario: Endpoint request is running
- **WHEN** a controller workflow action triggers a backend request that has not completed
- **THEN** the page SHALL show an in-context progress indicator (spinner/progress banner/overlay) until completion or failure
