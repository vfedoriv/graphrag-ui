## ADDED Requirements

### Requirement: Knowledge base mutation failures are surfaced inline
The system SHALL render explicit error feedback for create, update, and delete knowledge base failures in the Knowledge Bases controller page.

#### Scenario: Inline update fails
- **WHEN** inline name update request fails
- **THEN** the system SHALL render a visible update failure alert in the page context

#### Scenario: Delete fails
- **WHEN** delete request fails
- **THEN** the system SHALL render a visible delete failure alert and SHALL NOT clear selected knowledge base state
