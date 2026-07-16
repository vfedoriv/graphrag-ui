## 1. Inspector Structure and Density

- [x] 1.1 Add Schema Builder-specific inspector/description hooks and preserve accessible labels for metadata, node, relationship, and property controls.
- [x] 1.2 Bound the wide-screen sidebar with viewport-aware vertical overflow so long inspector content remains reachable without determining the full Visual Builder section height.
- [x] 1.3 Restore normal document flow for the single-column responsive layout and verify inspector controls do not clip horizontally.
- [x] 1.4 Apply scoped compact textarea, card-gap, and property-row grid styles with a narrow-width single-column fallback.

## 2. Canvas Control Visibility

- [x] 2.1 Theme React Flow control surfaces, borders, icons, and separation within the Schema Builder canvas using existing application color tokens.
- [x] 2.2 Add visible hover, active, disabled, and focus-visible states without changing control accessible names, hit areas, or behavior.

## 3. Verification

- [x] 3.1 Extend `SchemaBuilderPage` component tests with a relationship containing many properties and verify all compact inspector controls remain present, named, and editable.
- [x] 3.2 Add or extend Playwright coverage for a wide desktop long-inspector layout, a narrow responsive layout, and Schema Builder canvas controls in light and dark themes.
- [x] 3.3 Run `npm run lint`, `npm run test:run`, the relevant Playwright tests, and `npm run build`; resolve any regressions.
