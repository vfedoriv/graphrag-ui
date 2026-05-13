## Context

Several workflows rely on YAML/JSON payloads but currently use generic plain textareas and previews. This creates cognitive load and increases parse mistakes. The change should improve clarity without changing endpoint behavior.

## Goals / Non-Goals

**Goals:**
- Provide format-aware editing/presentation for YAML/JSON payload fields.
- Add lightweight formatting actions (prettify) for valid payloads.
- Keep behavior consistent across schema/query workflows.
- Add regression tests for formatting and error handling behavior.

**Non-Goals:**
- Replacing all text fields in the app with rich code editors.
- Backend-side parsing or contract changes.
- Full schema/JSON validation engine redesign.

## Decisions

- Decision: Introduce or extend a shared structured-text component with `format` mode (`json` | `yaml`) and optional `onFormat` action.
  Rationale: centralizes behavior and avoids one-off per-page implementations.
  Alternative: per-page custom logic. Rejected due to duplication.

- Decision: Use conservative formatting behavior: format only when parseable, preserve text on parse failure, and show an inline error.
  Rationale: prevents destructive edits and maintains user trust.
  Alternative: attempt best-effort mutation on invalid text. Rejected as unpredictable.

- Decision: Roll out first to known structured fields (schema YAML + query params JSON + relevant previews).
  Rationale: targeted value with bounded scope.
  Alternative: broad all-textarea rollout. Rejected as high-risk and noisy.

## Risks / Trade-offs

- [Risk] YAML formatting/parsing dependencies may increase bundle size. → Mitigation: choose lightweight parser/formatter and tree-shake imports.
- [Risk] Users may expect full IDE features (lint/autocomplete). → Mitigation: scope UI language to “formatting/syntax clarity,” not full code editor features.

## Migration Plan

1. Add shared format-aware text area/editor primitive.
2. Wire JSON mode into query parameter fields and previews.
3. Wire YAML mode into schema authoring/preview fields.
4. Add formatting/error handling tests.
5. Validate with targeted tests and build.

Rollback: revert component integration and retain existing textarea behavior.

## Open Questions

- Whether formatting action should be manual-only or also available on blur/submit (default: manual-only).
