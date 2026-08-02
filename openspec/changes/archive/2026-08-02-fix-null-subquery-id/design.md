## Context

The backend creates one diagnostic attempt for each text-retriever branch per round. Because a branch processes a batch of subqueries, `DefaultAdvancedSearchRunProcessor.textAttempt` intentionally emits `subqueryId: null`. The backend Java record, persistence model, and response DTO permit that value.

The frontend's Advanced Search parser currently validates `diagnostics.attempts[].subqueryId` with `z.string()`, while its TypeScript model also declares `subqueryId: string`. Any otherwise valid result containing the backend's branch-level diagnostic records is therefore classified as malformed before answer, evidence, or diagnostics rendering begins.

## Goals / Non-Goals

**Goals:**

- Represent the backend contract accurately with `string | null` in the frontend type and runtime schema.
- Allow valid version-one results with branch-level attempts to reach semantic result rendering.
- Keep diagnostic warnings meaningful when an attempt has no subquery identifier.
- Add regression coverage for nullable branch-level attempts and continued rejection of invalid attempt shapes.

**Non-Goals:**

- Changing the backend response or generating synthetic subquery identifiers.
- Expanding branch-level attempts into one record per subquery.
- Relaxing validation for citation, evidence, answer, or other diagnostic fields.
- Changing the answer-abstention behavior represented by `ANSWER_UNAVAILABLE` and `REPAIR_FAILED`.

## Decisions

### Model `subqueryId` as nullable

Change the runtime schema and TypeScript diagnostic type to accept `string | null`. This matches the existing backend behavior and preserves the distinction between a concrete subquery attempt and an aggregate branch attempt.

The alternative of requiring the backend to emit a synthetic ID would make diagnostics appear more precise than they are. Emitting one attempt per subquery would require a broader backend contract and is outside this frontend fix.

### Preserve the null value and use the retriever as the warning label

The parser will retain `null` rather than coercing it to an empty string or fabricated ID. When a branch-level attempt contributes a warning, the UI will identify the retriever branch instead of displaying the literal `null` as an attempt identifier.

### Keep the result safety gate intact

Only this known nullable field becomes optional. Envelope validation, payload-version checks, strict object validation, reference resolution, and raw-payload fallback remain unchanged. A malformed value in any other field must still stop semantic rendering.

## Risks / Trade-offs

- **[Risk]** A future backend response could use `null` for a genuinely missing identifier caused by a defect. → **Mitigation:** preserve strict validation for all other fields and label null attempts as branch-level rather than hiding them.
- **[Risk]** Existing tests may construct diagnostic attempts with non-null IDs and assume string-only typing. → **Mitigation:** update shared fixtures/types and add explicit null coverage without weakening non-null cases.
- **[Trade-off]** Branch-level warnings cannot name a specific subquery. → **Mitigation:** include the retriever branch in the warning and retain the complete attempt object in the diagnostics/raw JSON.

## Migration Plan

No data or backend migration is required. Deploy the frontend schema/type and diagnostic-label changes together. Rollback is a frontend-only revert; backend payloads remain compatible with the previous and updated frontend except that the previous frontend will continue rejecting nullable branch attempts.

## Open Questions

None for this scoped fix.
