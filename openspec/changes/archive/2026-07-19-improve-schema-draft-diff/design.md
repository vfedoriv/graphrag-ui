## Context

The Diff workbench section currently maps each response item directly to a generic `notice`-styled `<details>` element. The shared notice primitive was designed for alerts rather than dense review queues, so its full-surface compatibility color, browser-native marker, summary focus outline, and unconstrained before/after previews produce the awkward presentation visible in the reported screenshot. Summary content also concatenates the coordinate, operation, and compatibility with separators, while filters expose transport enum labels and give no indication of result totals.

The backend already provides all required information through `DiffResponse`: an aggregate revision identifier and stable change items containing `coordinate`, `compatibility`, `operation`, `before`, and `after`. This change must remain frontend-only, preserve those values exactly, work in light and dark themes, and follow the scalable disclosure patterns already established by candidate review items.

## Goals / Non-Goals

**Goals:**

- Make the overall risk and size of a diff understandable before opening individual items.
- Make collapsed rows compact and easy to scan while retaining accessible keyboard disclosure.
- Make expanded before/after states easy to compare across primitive, null, absent, array, and object values.
- Keep detailed values lazily rendered and keep filtering entirely client-side.
- Provide responsive behavior that remains usable at the application's narrow breakpoint.

**Non-Goals:**

- Changing diff calculation, compatibility classification, operation values, ordering, or backend DTOs.
- Adding inline schema editing, accepting/rejecting changes, bulk review actions, or diff persistence.
- Introducing a general-purpose JSON diff library or syntax-aware line diff.
- Redesigning other Schema Drafts workbench sections.

## Decisions

### Use a feature-specific diff review component

Extract the presentation from `SchemaDraftsPage.tsx` into a feature-local component (for example, `SchemaDiffReview.tsx`) with dedicated classes for the toolbar, summary, review queue, row, and comparison panels. It will receive the loaded change list and own only presentation/filter/disclosure state. The page will continue to own the existing review query and error/no-aggregate states.

This avoids expanding the already large page component and prevents alert-oriented `.notice` styles from defining interactive row behavior. Reusing the current generic notice block was rejected because compatibility is row metadata, not an alert, and the current visual defect comes from that semantic mismatch.

### Preserve native disclosure semantics with a designed summary

Each row will remain a `<details>`/`<summary>` pair so keyboard activation, expanded state, and assistive-technology semantics are native. The summary will use a custom chevron and separate regions for coordinate, a human-readable operation label, and a compatibility badge. The native marker will be suppressed consistently, and `:focus-visible` will outline only the interactive summary with appropriate inset spacing and border radius.

A custom button-controlled panel was considered, but it would require duplicating disclosure semantics and state without adding needed behavior.

### Separate risk overview from filter controls

Above the queue, render the total change count and counts for each compatibility class. Counts are derived with `useMemo` from the unfiltered response and are informational rather than alternate filter controls. The toolbar retains two labeled selects, displays the visible result count, converts enum values into readable text, and offers `Clear filters` only while a filter is active.

Keeping count chips informational avoids introducing two competing filter interaction models. The existing filter values remain the source of truth, so no URL or server-state changes are needed.

### Render exact values inside semantic comparison panels

Expanded content will use two labeled panels in a responsive grid. Each panel will explicitly describe `null` as `No value` while retaining its exact serialized representation, and will render all other values with the existing JSON formatter in a constrained, wrapping/scrolling preview. The panels will use neutral surfaces; compatibility color will be reserved for the badge and a narrow row accent so large tinted blocks do not overwhelm the page.

The comparison remains side-by-side when space permits and stacks at the existing narrow breakpoint. A line-oriented diff library was rejected because the API describes semantic before/after values rather than source text, and a new dependency would add complexity without improving small schema changes.

### Render expanded payloads lazily and test observable behavior

Introduce row-local disclosure state (or a small item component using `onToggle`) so before/after previews are mounted only while that row is open. Tests will assert default collapse, disclosure behavior, readable labels, counts, filter reset/result feedback, exact values, and accessible names. Responsive layout will be enforced through CSS media rules and covered by selector/class assertions where jsdom cannot calculate layout; browser-level visual verification can follow during implementation.

## Risks / Trade-offs

- [Operation enums may grow beyond the labels initially mapped] → Use a generic enum-to-title-case formatter with optional overrides, so unknown operations remain readable and are never hidden.
- [Coordinates or JSON values may be very long] → Allow coordinate wrapping and constrain previews with overflow handling without truncating copied/visible data.
- [Compatibility colors can have insufficient contrast across themes] → Reuse semantic theme tokens and keep text labels in every badge; never communicate status by color alone.
- [Derived counts and filters could drift from backend ordering] → Derive all views from the single response array and preserve its original order after filtering.
- [Lazy mounting changes what tests can query while rows are closed] → Update tests to assert the intended progressive-disclosure contract explicitly.

## Migration Plan

Implement the new component and styles behind the existing Diff tab, replace the inline mapping, and update tests. No data migration or deployment coordination is needed. Rollback consists of restoring the previous inline renderer; the API response and query cache remain unchanged.

## Open Questions

None. The existing API supplies the complete state needed for this presentation-only improvement.
