## ADDED Requirements

### Requirement: Release workbench pagination identifies item totals
The system SHALL identify every total displayed by a Release workbench pager as a total number of items while preserving the existing page numbering and navigation behavior.

#### Scenario: Describe release workbench totals explicitly
- **WHEN** an eligibility, evaluation outcome, evaluation history, reprocessing plan item, or reprocessing plan history pager is displayed for any page and total count
- **THEN** the system SHALL render `Page <current page> · <count> items total`
- **AND** SHALL use the complete item count for the corresponding paged result as `<count>`
