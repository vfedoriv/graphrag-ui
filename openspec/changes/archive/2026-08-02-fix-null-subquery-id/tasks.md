## 1. Align the Advanced Search result contract

- [x] 1.1 Change `AdvancedSearchAttemptDiagnostics.subqueryId` in `src/api/types.ts` from `string` to `string | null`.
- [x] 1.2 Change the `diagnostics.attempts[].subqueryId` Zod validator in `src/api/advancedSearch.ts` to accept strings or null while keeping the attempt object strict.

## 2. Preserve safe diagnostics rendering

- [x] 2.1 Update Advanced Search diagnostic warning formatting so a failed branch-level attempt uses its retriever name when `subqueryId` is null instead of displaying a fabricated or literal null identifier.
- [x] 2.2 Add API parser regression coverage for a backend-shaped version-one result containing null subquery IDs, asserting that parsing succeeds and preserves null values.
- [x] 2.3 Add regression coverage that non-nullable attempt fields still reject invalid values and that valid parsed results render the cited-result state rather than the malformed-result state.

## 3. Validate the frontend fix

- [x] 3.1 Run the focused Advanced Search tests and confirm nullable branch-level attempts are accepted.
- [x] 3.2 Run `npm run lint`, `npm run test:run`, and `npm run build`.
