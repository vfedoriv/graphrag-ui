## MODIFIED Requirements

### Requirement: Held-out evaluation uses explicit eligible document selection
The system SHALL load a paged backend eligibility resource for documents owned by the current knowledge base, SHALL validate and retain its authoritative draft-wide readiness and nullable blocking reason, SHALL explain that the checkboxes select unseen normal documents for held-out evaluation, SHALL allow selection only when the page is ready and a row is marked eligible, SHALL send the authoritative current draft revision with the selection and advisory flag, and SHALL provide a direct route to the normal Documents workflow for obtaining a separate held-out document.

#### Scenario: Select held-out documents
- **WHEN** the eligibility page reports `readiness: READY` and contains documents marked `eligible: true`
- **THEN** the system SHALL allow explicit multi-selection of those documents for evaluation
- **AND** SHALL retain the page's draft revision and current aggregate ID as the eligibility snapshot

#### Scenario: No held-out documents are available
- **WHEN** no returned document is eligible or no documents exist
- **THEN** the system SHALL explain that a separate held-out document is required
- **AND** SHALL disable evaluation start
- **AND** SHALL provide a link to the Documents page with instructions to upload and process a normal document in the current workspace, avoid adding it as a draft source, and return to Release

#### Scenario: Loaded eligibility page contains only ineligible rows
- **WHEN** the loaded eligibility page contains rows but none can be selected
- **THEN** the system SHALL retain the rows, backend-provided reasons, and pagination
- **AND** SHALL identify that no eligible held-out documents are available on the loaded page
- **AND** SHALL expose the Documents workflow link

#### Scenario: Document contributed active discovery evidence
- **WHEN** a document row is ineligible with reason `ACTIVE_DISCOVERY_EVIDENCE`
- **THEN** the system SHALL disable its selection and explain that it contributed to the current aggregate

#### Scenario: Draft analysis is required
- **WHEN** the eligibility page reports `readiness: NOT_READY` and `blockingReason: DRAFT_ANALYSIS_REQUIRED`
- **THEN** the system SHALL explain that current draft analysis is required before held-out evaluation
- **AND** SHALL disable document selection and evaluation start
- **AND** each row with `DRAFT_ANALYSIS_REQUIRED` SHALL show the analysis-required reason rather than claiming it contributed discovery evidence

#### Scenario: Eligibility response uses the expanded contract
- **WHEN** the backend returns `readiness` and `blockingReason` on an eligibility page
- **THEN** the system SHALL accept those declared fields while retaining strict rejection of undeclared response fields

#### Scenario: Eligibility snapshot becomes stale
- **WHEN** the draft revision or current aggregate changes after eligibility was loaded
- **THEN** the system SHALL invalidate the eligibility page and disable evaluation start until refreshed
