## ADDED Requirements

### Requirement: Candidate review order reflects schema hierarchy and analyzer strength
The system SHALL organize the complete candidate result into a deterministic logical sequence before applying Candidates UI pagination. The sequence SHALL contain every candidate exactly once, SHALL place all node groups before all relationship groups, and SHALL keep matching child candidates immediately after their parent within each group. Analyzer ordering SHALL NOT alter or imply a candidate's effective persistent review state.

#### Scenario: Order node groups and their children
- **WHEN** the candidate result contains node candidates and matching node-property or node-key candidates
- **THEN** the system SHALL order node candidates by analyzer confidence from highest to lowest, with missing confidence after provided confidence
- **AND** SHALL use independent-source support from greatest to least and stable candidate coordinates as subsequent tie-breakers
- **AND** SHALL place each node's property and key candidates immediately after that node
- **AND** SHALL order those children by confidence from highest to lowest, then independent-source support from greatest to least, followed by stable kind and coordinate tie-breakers

#### Scenario: Order relationships after nodes
- **WHEN** the candidate result contains relationship candidates
- **THEN** the system SHALL place every relationship group after every node group and unmatched node-owned candidate
- **AND** SHALL order relationships by recommendation state in the sequence `RECOMMENDED`, `REVIEW_REQUIRED`, `LOW_SUPPORT`, `SUPPRESSED`
- **AND** SHALL use confidence from highest to lowest, independent-source support from greatest to least, and stable relationship coordinates as subsequent tie-breakers
- **AND** SHALL place each matching relationship-property candidate immediately after its relationship, ordered by confidence, support, and stable property coordinates

#### Scenario: Keep ordering deterministic for missing or equal signals
- **WHEN** candidates have equal confidence and support or do not provide confidence
- **THEN** the system SHALL use normalized human-readable coordinates and candidate identity as deterministic tie-breakers
- **AND** SHALL place null confidence after any numeric confidence within the applicable comparison group
- **AND** SHALL produce the same sequence for equivalent candidate sets regardless of backend response order

#### Scenario: Preserve children without matching parents
- **WHEN** a node-owned or relationship-owned candidate has no matching parent candidate in the complete result
- **THEN** the system SHALL retain the unmatched candidate exactly once
- **AND** SHALL place unmatched node-owned candidates after complete node groups and before relationships
- **AND** SHALL place unmatched relationship-owned candidates after complete relationship groups
- **AND** SHALL NOT fabricate a reviewable parent candidate

#### Scenario: Organize across backend page boundaries
- **WHEN** matching parents and children or node and relationship candidates are returned on different backend pages
- **THEN** the system SHALL combine the complete candidate result before organizing it
- **AND** SHALL paginate the organized sequence into fixed-size candidate-item pages
- **AND** SHALL preserve global adjacency even when a parent is the last item of one UI page and its child is the first item of the next

#### Scenario: Describe review workbench totals explicitly
- **WHEN** an analysis outcome, analysis history, or Candidates pager is displayed for any page and total count
- **THEN** the system SHALL render `Page <current page> · <count> items total`
- **AND** SHALL use the complete item count for the corresponding paged result as `<count>`

#### Scenario: Candidate count shrinks after refresh
- **WHEN** refreshed candidate data leaves the selected UI page beyond the last available page
- **THEN** the system SHALL move to the last valid page of the organized sequence
- **AND** SHALL keep previous and next navigation boundaries consistent with the organized candidate count
