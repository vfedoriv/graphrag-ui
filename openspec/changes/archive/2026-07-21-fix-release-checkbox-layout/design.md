## Context

Global form styles make every `input` full width and every `label` a grid. That works for text fields, but the Release workflow also places native checkboxes and radio buttons directly in labels. A full-width checkbox retains a small native indicator while its layout box spans the panel, so the indicator is painted far from the label text. The advisory-assessment choice makes the problem especially visible above the full-width evaluation action.

## Goals / Non-Goals

**Goals:**

- Keep each Release checkbox or radio indicator immediately adjacent to its label text.
- Left-align choice controls and give the combined label only the width it needs.
- Retain native input semantics, keyboard behavior, state handling, and theme compatibility.
- Cover the advisory choice with a component-level regression test.

**Non-Goals:**

- Redesign the Release workflow, its stages, or action hierarchy.
- Change evaluation, publication, activation, or reprocessing behavior.
- Replace native controls or revise all form styling across the application.

## Decisions

1. Introduce a reusable choice-label class that uses an inline flex layout with centered items, a small gap, and content-sized width. Apply it to checkbox and radio labels in the Release workflow. This makes the intended control type explicit and avoids changing text-field labels elsewhere. A global `label` override was rejected because form labels intentionally use grid layout.

2. Scope the width reset to checkbox and radio inputs inside the choice-label class. The control will use intrinsic width, no flex growth, and a normalized margin. A global `input[type='checkbox']` reset was considered, but a scoped rule reduces the chance of altering established layouts in unrelated features.

3. Keep the input nested inside the label. This preserves the current accessible name and expands the clickable target without introducing generated IDs. The visual fix does not alter React state or the evaluation payload.

4. Add a focused component assertion that the advisory input is exposed by its visible label and participates in the dedicated choice layout. Existing workflow tests continue to verify toggling and submission behavior.

## Risks / Trade-offs

- [A reusable class can be forgotten on future choice controls] → Use a clear shared name and apply it consistently to all existing Release checkbox and radio labels in the touched component.
- [Content-sized labels provide less horizontal hit area than a full-row label] → Preserve padding-free native behavior and the clickable label text; do not make the input itself full width to enlarge the target.
- [Native checkbox appearance varies by browser] → Limit styling to layout and sizing rather than replacing the native control.
