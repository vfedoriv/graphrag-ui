## Context

`src/api/client.ts` currently assumes `fetch` always returns a `Response` and that success responses always contain valid JSON. In practice, fetch can reject before a response exists, and JSON parsing can fail for malformed payloads. Those paths currently leak raw `TypeError`/`SyntaxError`, which conflicts with the app's normalized `ApiError` expectations.

## Goals / Non-Goals

**Goals:**
- Ensure all `apiFetch` failure modes reject with `ApiError`.
- Make `ApiError` compatible with native `Error` behavior (`instanceof Error`, `message`, stack semantics).
- Preserve existing successful response behavior and `ProblemDetail` normalization.

**Non-Goals:**
- Introducing new backend error shapes or contract changes.
- Refactoring feature pages in this change.
- Changing request routing, query keys, or mutation orchestration.

## Decisions

- Decision: Convert `ApiError` from a plain type into a class extending `Error`.
  Rationale: Consumers already read `.message` and future integrations benefit from `instanceof Error` checks.
  Alternative considered: Keep a plain object and update all callers. Rejected because it spreads error-shape coupling across the codebase.

- Decision: Wrap `fetch` execution in `try/catch` and normalize any thrown value.
  Rationale: Network/abort/CORS failures happen before HTTP parsing and must share the same contract as HTTP failures.
  Alternative considered: Let transport errors bubble and handle in pages. Rejected because it fragments error handling.

- Decision: Wrap success-path JSON parsing in `try/catch` and normalize parsing failures.
  Rationale: A 2xx status does not guarantee valid JSON; callers should not receive raw parser errors.
  Alternative considered: return `null`/empty fallback on parse failure. Rejected because it hides data corruption and breaks typed expectations.

## Risks / Trade-offs

- [Risk] Existing tests or call sites may rely on plain-object error identity. → Mitigation: update client tests to assert on `ApiError` class behavior and keep `message`/`details` fields stable.
- [Risk] More generic user-facing messages for unexpected failures can lose low-level diagnostics. → Mitigation: preserve backend detail when available and keep normalized detail payload.

## Migration Plan

1. Introduce `ApiError` class in `src/api/types.ts` with backward-compatible fields.
2. Update `apiFetch` in `src/api/client.ts` to normalize transport and parse failures.
3. Expand unit tests for these branches.
4. Run lint/test/build and confirm no feature-level contract regressions.

Rollback: revert `ApiError` class and client normalization changes together to avoid mixed error contracts.

## Open Questions

- None for this scoped change.
