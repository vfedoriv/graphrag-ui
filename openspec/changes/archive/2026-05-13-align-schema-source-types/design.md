## Context

The GraphRAG backend supports only two schema source types: `PREDEFINED` and `GENERATED`. The frontend currently includes or permits `USER_DEFINED`, which is not part of the backend contract. This creates a contract mismatch across schema list rendering, schema creation/generation flows, and validation logic.

## Goals / Non-Goals

**Goals:**
- Enforce schema source type parity with backend by allowing only `PREDEFINED` and `GENERATED` in the UI.
- Remove unsupported `USER_DEFINED` handling from frontend enum definitions and UI source-type options.
- Keep existing schema workflows functional while restricting source-type values to backend-supported types.

**Non-Goals:**
- Changing backend schema APIs or enum definitions.
- Redesigning schema page layout or workflow structure.
- Introducing new schema source categories beyond current backend support.

## Decisions

- Decision: Restrict frontend schema source type union/enum to `PREDEFINED | GENERATED`.
  - Rationale: Strong typing catches unsupported values at compile time and avoids accidental UI exposure.
  - Alternative considered: Keep `USER_DEFINED` in UI but map it before requests. Rejected because it preserves an invalid domain concept and risks inconsistent behavior.

- Decision: Update schema-related UI controls to only render backend-supported source types.
  - Rationale: Prevents users from selecting an invalid value and aligns user-visible behavior with backend capability.
  - Alternative considered: Hide unsupported values conditionally per route. Rejected because source type is a global domain constraint, not route-specific.

- Decision: Treat unknown source types in responses as a visible fallback state instead of silently coercing.
  - Rationale: Preserves resilience if backend changes unexpectedly while surfacing clear diagnosis for follow-up fixes.
  - Alternative considered: Force-cast unknown values to `GENERATED`. Rejected because it can misrepresent backend data.

## Risks / Trade-offs

- [Risk] Existing tests may rely on `USER_DEFINED` fixtures and fail after enum narrowing. -> Mitigation: update fixtures and assertions to supported values and add explicit regression checks.
- [Trade-off] Stricter enum enforcement may require touching multiple files. -> Mitigation: centralize source type definition and reuse across feature modules.
