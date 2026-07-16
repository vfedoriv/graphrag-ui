## Why

Selecting a schema node or relationship with many properties makes the Visual Builder panel grow to the full inspector height, leaving a large empty area beneath the canvas and pushing the synchronized Schema JSON section far down the page. The inspector is also unnecessarily sparse, and React Flow controls have insufficient contrast in dark mode, making the workspace harder to scan and operate.

## What Changes

- Bound the desktop Visual Builder workspace to a practical viewport-relative height and let the inspector sidebar scroll independently when its content exceeds that height.
- Keep the canvas/actions area compact so a long node or relationship property list does not create blank space or unnecessarily displace the Raw JSON contract section.
- Reduce inspector spacing and description-field height while retaining usable labels, controls, and responsive behavior.
- Improve the Zoom In, Zoom Out, Fit View, and Toggle Interactivity control surfaces, icons, borders, hover states, and focus states for dark-mode visibility.
- Add focused UI coverage for long inspector content, compact description fields, overflow behavior, and theme-aware canvas controls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-schema-builder`: Require a compact, independently scrollable element inspector and clearly visible canvas controls across supported appearance themes.

## Impact

- Affects the Schema Builder layout and inspector markup in `src/features/schema-builder/SchemaBuilderPage.tsx`.
- Affects Schema Builder, textarea, and React Flow theme styles in `src/index.css`.
- Affects focused Schema Builder component tests; browser-level visual verification may be added where CSS behavior cannot be meaningfully asserted in jsdom.
- No backend API, schema JSON contract, route, or dependency changes are required.
