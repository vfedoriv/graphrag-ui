## 1. Draft Target Link Affordance

- [x] 1.1 Add a feature-specific class and, if useful, a decorative directional icon to the existing draft target `Link` while preserving its text accessible name and `/schema-drafts/:draftId` destination.
- [x] 1.2 Style the draft target link with a persistent non-color affordance plus distinct hover and `:focus-visible` states using existing theme tokens.
- [x] 1.3 Check the link treatment in both supported themes and at the drafts table's responsive overflow boundary.

## 2. Verification

- [x] 2.1 Add a Schema Drafts page test that verifies the target is exposed as a link, uses the intentional affordance class, and points to the correct draft workbench route.
- [x] 2.2 Run the focused Schema Drafts test, lint, and production build.
