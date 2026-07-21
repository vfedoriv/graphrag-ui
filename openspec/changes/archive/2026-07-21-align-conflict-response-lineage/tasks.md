## 1. Align the conflict response contract

- [x] 1.1 Add required `aggregateRevisionId: string` and `current: boolean` properties to the frontend `ConflictResponse` type.
- [x] 1.2 Add the same required properties to the strict Zod conflict schema used by list and resolution parsing.

## 2. Update fixtures and regression coverage

- [x] 2.1 Update reusable and inline schema-draft conflict fixtures with representative aggregate lineage and currentness values.
- [x] 2.2 Add API-level coverage proving an unscoped conflict-list response with the expanded contract parses successfully and the request continues to omit a history scope.
- [x] 2.3 Add API-level or workflow coverage proving a successful conflict-resolution response with the expanded contract parses successfully.

## 3. Validate the compatibility change

- [x] 3.1 Run the focused schema-draft API and page tests covering conflict listing and resolution.
- [x] 3.2 Run `npm run lint`, `npm run test:run`, and `npm run build`.
