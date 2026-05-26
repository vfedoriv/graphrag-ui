## Context

The Schemas page includes two workflows that generate schema examples (`Generate schema example from text` and `Generate schema example from file`). Those workflows currently parse successful responses as wrapped objects containing an `example` field. Backend behavior changed so both endpoints now return the example payload directly as a string containing a JSON array of relationship objects. Without parser updates, the UI can show empty/incorrect output and break downstream editing expectations.

## Goals / Non-Goals

**Goals:**
- Accept new schema example response shape where the response body is the raw example string.
- Preserve compatibility with legacy wrapped responses during rollout.
- Keep existing output rendering and editability behavior unchanged for users.
- Add focused tests for response parsing behavior in both schema example workflows.

**Non-Goals:**
- No backend contract changes.
- No redesign of schema example editor UI.
- No changes to schema JSON generation endpoints or unrelated schema workflows.

## Decisions

1. Introduce a normalization step for schema example generation responses.
- Decision: Normalize successful responses to a single frontend string output contract regardless of backend shape.
- Rationale: UI components and form state already consume string outputs; normalization isolates contract drift to one parsing layer.
- Alternative considered: Update every caller to branch on response shape. Rejected because it duplicates parsing logic and increases regression risk.

2. Support dual-shape parsing with strict preference for new raw-string payload.
- Decision: Treat a plain string response as canonical and accept object responses with `example` as backward-compatible fallback.
- Rationale: Aligns with new backend behavior while maintaining compatibility across mixed deployments.
- Alternative considered: Hard cutover to string-only parsing. Rejected because staggered environment upgrades could break older backends.

3. Fail fast on unexpected successful payload shapes.
- Decision: If payload is neither string nor object with string `example`, raise normalized client error rather than silently coercing.
- Rationale: Silent coercion hides contract issues; explicit failure is easier to diagnose.
- Alternative considered: Best-effort stringify unknown payloads. Rejected because it can produce misleading output.

## Risks / Trade-offs

- [Risk] Mixed backend versions can return different success payloads. → Mitigation: dual-shape parser with deterministic precedence.
- [Risk] Parsing logic regression can affect both text/file example tabs. → Mitigation: add unit/integration tests for both workflows and both payload shapes.
- [Trade-off] Temporary compatibility path adds parser complexity. → Mitigation: keep logic centralized and remove fallback once backend migration is fully complete.
