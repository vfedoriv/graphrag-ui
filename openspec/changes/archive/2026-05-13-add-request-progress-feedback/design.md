## Context

The app performs many mutation/query calls, but in multiple workflows users only see a static button or delayed content change. Without pending feedback, users can interpret delays as broken UI and trigger duplicate requests.

## Goals / Non-Goals

**Goals:**
- Provide visible, consistent pending feedback for backend-bound actions.
- Prevent duplicate clicks while requests are in flight.
- Keep behavior consistent across core controller pages.
- Add regression tests for pending-state visibility and disabled interaction.

**Non-Goals:**
- Exact request percent progress (backend does not currently provide progress metrics).
- Replacing existing layout architecture.
- Introducing WebSocket/streaming status channels.

## Decisions

- Decision: Use a two-layer feedback model: button-level loading state plus optional section-level spinner/banner for long operations.
  Rationale: immediate local feedback with minimal visual disruption.
  Alternative: only global overlay popup. Rejected as too heavy for short requests.

- Decision: Drive pending state from existing TanStack Query mutation/query `isPending` and `isFetching` signals.
  Rationale: no extra state machine required and aligns with current data layer.
  Alternative: custom local pending state flags. Rejected due to duplication risk.

- Decision: Standardize visual language via shared UI primitive(s) (e.g., `LoadingIndicator` / `ProgressBanner`).
  Rationale: consistency and easier adoption across pages.
  Alternative: per-page ad hoc spinners. Rejected due to inconsistent UX.

## Risks / Trade-offs

- [Risk] Too many simultaneous indicators may create UI noise. → Mitigation: prefer one indicator per active workflow section and reuse shared copy/text.
- [Risk] Disabled buttons may block rapid power-user workflows. → Mitigation: only disable while the exact request is in flight.

## Migration Plan

1. Add shared loading indicator primitive and button pending affordance.
2. Integrate pending UI into key controller actions (schemas, documents, queries, knowledge bases).
3. Ensure disable/enable behavior is correct on success/error settle.
4. Add tests for pending visibility and duplicate-click prevention.
5. Validate via targeted tests and build.

Rollback: remove shared pending indicators and revert button pending wiring.

## Open Questions

- Whether to include a small global top progress bar in addition to local indicators (default: local indicators first).
