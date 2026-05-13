## Context

The shared `Table` component currently keys rows by positional index. Knowledge Bases uses uncontrolled inline name inputs within that table. When rows are removed, React can recycle DOM nodes and leave stale values in the wrong row, creating the appearance of data corruption.

## Goals / Non-Goals

**Goals:**
- Introduce stable row key support in shared table rendering.
- Use knowledge base ID-backed keys in Knowledge Bases page row rendering.
- Prevent unnecessary rename requests when field value is unchanged.
- Add regression tests for identity stability and inline edit request gating.

**Non-Goals:**
- Converting all inline editors to fully controlled form state.
- Refactoring unrelated table usage outside this change's risk area.
- Backend mutation contract changes.

## Decisions

- Decision: Add optional `rowKeys` prop to `Table` and use it when provided.
  Rationale: minimal API extension that preserves current call sites while enabling stable identity where needed.
  Alternative: infer keys from first cell value. Rejected as brittle and non-explicit.

- Decision: Keep Knowledge Bases inline editor structure but guard `onBlur` updates with value comparison.
  Rationale: fixes noisy update calls with low implementation risk and keeps UI unchanged.
  Alternative: switch to controlled per-row edit state. Rejected as larger refactor than needed for this issue.

- Decision: Add tests covering delete + inline input behavior and no-op blur behavior.
  Rationale: directly protects the regression vector reported in code review.
  Alternative: only test table key plumbing in isolation. Rejected due to missing end-to-end workflow confidence.

## Risks / Trade-offs

- [Risk] Introducing `rowKeys` may be inconsistently adopted by future call sites. → Mitigation: keep prop explicit and add tests/documentation in the table usage where risk is highest.
- [Risk] Uncontrolled inputs can still be sensitive to other list update patterns. → Mitigation: combine stable row keys with request gating and preserve existing error feedback.

## Migration Plan

1. Extend shared `Table` prop API with stable row key input.
2. Update Knowledge Bases page table usage to pass knowledge base IDs as row keys.
3. Gate blur-triggered update mutations when value is unchanged.
4. Add/extend tests for row identity and mutation call behavior.
5. Run targeted tests and build.

Rollback: revert Table prop extension and KB page usage together to avoid mismatched assumptions.

## Open Questions

- None.
