## Context

Current measured coverage is substantially higher than configured thresholds, while TypeScript compiler options omit `strict`. Enabling both at once can expose many small issues, so this change should happen after the guardrails are green and preferably after the largest refactors have landed.

## Goals / Non-Goals

**Goals:**
- Enable `strict` TypeScript without changing runtime behavior.
- Raise coverage thresholds to meaningful levels below the current baseline.
- Add targeted tests for weak areas exposed by threshold ratcheting.

**Non-Goals:**
- No broad type-system perfection pass beyond `strict`.
- No `noUncheckedIndexedAccess` requirement in this change.
- No product behavior changes.

## Decisions

- Enable `strict` before optional stricter flags.
  - Rationale: `strict` gives the largest safety improvement and is the standard baseline for TypeScript projects.
  - Alternative: enable many strict flags at once; rejected because it would increase churn and make behavior-preserving validation harder.

- Set coverage thresholds below the current measured baseline with some margin.
  - Rationale: thresholds should prevent backsliding without making harmless refactors brittle.
  - Initial target: statements 80, branches 70, functions 78, lines 82.

- Fix real type issues rather than suppressing them by default.
  - Rationale: strict mode is only useful if suppressions remain exceptional and local.

## Risks / Trade-offs

- Strict mode can reveal many nullability issues in UI state -> resolve in small commits with focused tests for behavior-sensitive paths.
- Coverage thresholds can become noisy during refactors -> ratchet after guardrails and major decomposition are stable.
- Some third-party typings may produce friction -> keep `skipLibCheck` unchanged unless there is a clear reason to revisit it.
