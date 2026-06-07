## 1. Layout Investigation

- [x] 1.1 Identify the app shell component and CSS rules that center the layout or constrain the global shell width.
- [x] 1.2 Confirm current sidebar width, main content width behavior, and narrow viewport behavior before editing.

## 2. Shell Layout Implementation

- [x] 2.1 Update the shell container so desktop layout is left-anchored with responsive outer padding instead of centered by a narrow max-width.
- [x] 2.2 Set the primary navigation/sidebar to a fixed desktop width that does not grow or shrink with available space.
- [x] 2.3 Set the main content region to flex across remaining viewport width with `min-width: 0` and preserved internal spacing.
- [x] 2.4 Preserve or adjust narrow viewport rules so the shell remains usable without shell-caused horizontal page overflow.

## 3. Validation

- [x] 3.1 Run `npm run lint`.
- [x] 3.2 Run `npm run build`.
- [x] 3.3 Verify the app in a browser at wide desktop, laptop, and narrow viewport widths, including the Documents page shown in the reference screenshot.
- [x] 3.4 Check that existing navigation and active knowledge base selection still behave unchanged after the layout update.
