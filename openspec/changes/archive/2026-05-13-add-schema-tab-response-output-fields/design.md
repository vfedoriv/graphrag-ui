## Context

The Schemas page already organizes endpoint actions into tabs and supports schema generation workflows, including file-based input selection and editable YAML outputs before create actions. In three tabs (`Generate schema YAML`, `Generate schema YAML from file`, `Get schema by ID`), users report they cannot see returned backend payloads in a clear output field after request execution.

This change is a frontend-only behavior update in `graphrag-ui` and must preserve current backend contracts under `/api/v1`.

## Goals / Non-Goals

**Goals:**
- Ensure each affected tab has a dedicated output text area bound to the tab's latest successful backend response.
- Keep endpoint workflows consistent with existing controller-style tab UX and output-preview patterns.
- Keep existing error handling while making successful response visibility deterministic.

**Non-Goals:**
- No backend API or DTO contract changes.
- No redesign of the full Schemas page navigation or tab model.
- No auth, permission, or workflow policy changes.

## Decisions

1. Use per-tab response state rather than a single shared output state.
Rationale: Avoid accidental cross-tab overwrites and maintain predictable behavior when users switch tabs.
Alternative considered: Global output pane shared by all schema tabs. Rejected because it obscures which action produced the content.

2. Render response outputs as explicit text areas aligned with existing output-preview conventions.
Rationale: The page already relies on visible text outputs for generated content and editing flows.
Alternative considered: Toast-only or collapsible JSON panel. Rejected because it is transient or less discoverable.

3. Replace output on each new success and clear stale output on new request start for the same tab.
Rationale: Users should always see the latest request result and not confuse stale content with new calls.
Alternative considered: Preserve previous output until success. Rejected because failed retries can leave misleading previous results.

## Risks / Trade-offs

- [Risk] Backend responses may vary in shape across endpoints -> Mitigation: Normalize output mapping in the schema feature layer before rendering text.
- [Risk] Clearing output at request start can hide previous useful content during transient failures -> Mitigation: preserve and surface explicit error state messaging so failure cause remains visible.
- [Risk] Additional UI state increases test surface -> Mitigation: add focused tab-level tests for request-success, request-failure, and repeat-request behavior.
